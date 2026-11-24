import type { VisibilityPolicy } from '@/config/flavor';
import type {
  HighlightRule,
  MutashabihGroup,
  MutashabihMember,
  MutashabihatDataset,
  ReviewStatus,
  SimilarityType,
  SourceName,
} from '@/domain/mutashabihat';
import type { AyahId } from '@/domain/quran';
import { groupTitle, pairTitle, titleKey, type ListTitle } from '@/domain/title';

export type Scope = 'all' | 'pilot';
/** Which similarity types to list. Default everywhere is 'lafzi' (MVP); 'semantic' is a review-build filter. */
export type SimilarityFilter = SimilarityType | 'any';

/** One analogue of an opened ayah: the other side of a pair found in one or more visible groups. */
export type Analogue = {
  /** First ayah of the analogue member (route target). */
  ayahId: AyahId;
  /** Full span of the analogue member. */
  ayahIds: AyahId[];
  /** Span of the opened side in the chosen group (may be several ayahs for Waqar144 multi-ayah entries). */
  selfAyahIds: AyahId[];
  /** Group chosen for display: HifzLink first (PO decision), then Waqar144, then Quranpedia. */
  primary: MutashabihGroup;
  /** Every visible group that links the two ayahs. */
  groups: MutashabihGroup[];
  status: ReviewStatus;
  pilot: boolean;
  sources: SourceName[];
  similarityType: SimilarityType;
};

/** A position (مَوضِع) for browsing: an ayah with at least one visible analogue. */
export type Position = {
  ayahId: AyahId;
  analogueCount: number;
  statuses: ReviewStatus[];
  pilot: boolean;
  /** Similarity type of the first analogue (shown with fallback titles). */
  similarityType: SimilarityType;
  /** Title from the first (primary) analogue's rule, in this ayah's wording; undefined → UI fallback. */
  title?: ListTitle;
};

/**
 * One row of the records (mutashabihat) list: one distinct similar phrase. Records with the same normalised title
 * are merged into one row, and records whose ayahs all lie inside a larger record of the same list are folded
 * into that record's row (no duplicates in the list; see docs/DATA_MODEL.md "De-duplication").
 */
export type RecordRow = {
  /** Id of the row's primary record (pilot first, then HifzLink > Waqar144 > Quranpedia, then list order). */
  id: string;
  title?: ListTitle;
  /** titleKey() of the title; the row's identity in the list. */
  titleKey: string;
  /** Every record shown in this row, primary first (no record appears in two rows). */
  groups: MutashabihGroup[];
  /** Every ayah (position) of the row, unique, mushaf order. */
  ayahIds: AyahId[];
  statuses: ReviewStatus[];
  pilot: boolean;
  sources: SourceName[];
  similarityType: SimilarityType;
};

export type DatasetInfo = {
  kind: MutashabihatDataset['kind'];
  datasetVersion: number;
  groupCount: number;
  pilotCount: number;
  statusCounts: Record<ReviewStatus, number>;
  similarityCounts: Record<SimilarityType, number>;
};

export interface MutashabihatRepository {
  readonly policy: VisibilityPolicy;
  getDatasetInfo(): DatasetInfo;
  /** Visible groups (already filtered by the build flavor's policy). */
  getGroups(scope?: Scope, similarity?: SimilarityFilter): MutashabihGroup[];
  /** Records list rows: one row per distinct similar phrase (de-duplicated), in list order. */
  getRecordRows(scope?: Scope, similarity?: SimilarityFilter): RecordRow[];
  getAnalogues(ayahId: AyahId, scope?: Scope, similarity?: SimilarityFilter): Analogue[];
  /** Ayah ids (mushaf order) that have at least one visible analogue. */
  getPositionAyahIds(scope?: Scope, similarity?: SimilarityFilter): AyahId[];
  /** Positions among the given ayah ids (mushaf order), for surah / juz / page browsing (QMT-30/31/32). */
  getPositionsIn(ayahIds: AyahId[], scope?: Scope, similarity?: SimilarityFilter): Position[];
  /** Data-driven highlight rule for a pair (QMT-26), if one is visible. */
  getHighlightRule(a: AyahId, b: AyahId): HighlightRule | undefined;
}

export const SOURCE_PRIORITY: SourceName[] = ['hifzlink', 'waqar144', 'quranpedia'];

export class DatasetPolicyError extends Error {}

const spanOf = (m: MutashabihMember): AyahId[] => m.ayahIds ?? [m.ayahId];
const STATUS_ORDER: ReviewStatus[] = ['approved', 'under_review', 'draft', 'rejected'];
/** Source names of a record, including merged duplicates (attributions). */
export const sourcesOf = (g: MutashabihGroup): SourceName[] => g.attributions?.map((x) => x.name) ?? [g.source.name];
const bySourcePriority = (names: SourceName[]) =>
  [...new Set(names)].sort((a, b) => SOURCE_PRIORITY.indexOf(a) - SOURCE_PRIORITY.indexOf(b));
const pairKey = (a: AyahId, b: AyahId) => (a < b ? `${a}|${b}` : `${b}|${a}`);

/**
 * Flavor-aware repository over a bundled dataset. Filtering happens here, at the repository layer,
 * so non-visible records never reach the UI (QMT-48 / DAT-06).
 */
export class LocalMutashabihatRepository implements MutashabihatRepository {
  private readonly groups: MutashabihGroup[];
  private readonly byAyah = new Map<AyahId, MutashabihGroup[]>();
  private readonly rules = new Map<string, HighlightRule>();
  /** Pairs tagged semantic that this build may not show. */
  private readonly blockedPairs = new Set<string>();

  constructor(
    private readonly dataset: MutashabihatDataset,
    readonly policy: VisibilityPolicy,
    private readonly positionOf: (id: AyahId) => number,
  ) {
    if (dataset.kind !== policy.dataset) {
      throw new DatasetPolicyError(
        `Flavor "${policy.flavor}" requires the ${policy.dataset} dataset but got "${dataset.kind}".`,
      );
    }
    const visible = (s: ReviewStatus) => policy.visibleStatuses.includes(s);
    this.groups = dataset.groups.filter((g) => visible(g.status) && this.allowed(g.similarityType));
    for (const g of this.groups) {
      for (const m of g.members) {
        for (const id of spanOf(m)) {
          const list = this.byAyah.get(id);
          if (list) list.push(g);
          else this.byAyah.set(id, [g]);
        }
      }
    }
    for (const r of dataset.highlightRules) {
      const key = pairKey(r.pair[0], r.pair[1]);
      // Any semantic tag (whatever the rule's status) blocks the pair in builds that may not show semantic pairs.
      if (r.similarityType === 'semantic' && !policy.allowedSimilarity.includes('semantic')) {
        this.blockedPairs.add(key);
        continue;
      }
      if (visible(r.status)) this.rules.set(key, r);
    }
  }

  private allowed(t: SimilarityType | undefined): boolean {
    if (this.policy.requireExplicitLafzi) return t === 'lafzi';
    return this.policy.allowedSimilarity.includes(t ?? 'lafzi');
  }

  /** Pair classification: the pair's rule wins, else its group, else lafzi (review only). */
  private pairSimilarity(a: AyahId, b: AyahId, group: MutashabihGroup): SimilarityType {
    if (this.blockedPairs.has(pairKey(a, b))) return 'semantic';
    return this.rules.get(pairKey(a, b))?.similarityType ?? group.similarityType ?? 'lafzi';
  }

  /**
   * PO decision: in the review build every committee pilot pair (285 HifzLink) is listed in the default
   * view whatever its similarityType (with a type badge). Never applies to beta/production.
   */
  private pilotAlwaysVisible(pilot: boolean | undefined, f: SimilarityFilter): boolean {
    return !!pilot && f === 'lafzi' && this.policy.allowedSimilarity.includes('semantic');
  }

  private matches(t: SimilarityType | undefined, f: SimilarityFilter): boolean {
    return f === 'any' || (t ?? 'lafzi') === f;
  }

  getDatasetInfo(): DatasetInfo {
    const statusCounts: Record<ReviewStatus, number> = { draft: 0, under_review: 0, approved: 0, rejected: 0 };
    const similarityCounts: Record<SimilarityType, number> = { lafzi: 0, semantic: 0 };
    for (const g of this.groups) {
      statusCounts[g.status]++;
      similarityCounts[g.similarityType ?? 'lafzi']++;
    }
    return {
      kind: this.dataset.kind,
      datasetVersion: this.dataset.datasetVersion,
      groupCount: this.groups.length,
      pilotCount: this.groups.filter((g) => g.pilot).length,
      statusCounts,
      similarityCounts,
    };
  }

  getGroups(scope: Scope = 'all', similarity: SimilarityFilter = 'lafzi'): MutashabihGroup[] {
    return this.groups.filter(
      (g) =>
        (scope !== 'pilot' || g.pilot) && (this.pilotAlwaysVisible(g.pilot, similarity) || this.matches(g.similarityType, similarity)),
    );
  }

  getRecordRows(scope: Scope = 'all', similarity: SimilarityFilter = 'lafzi'): RecordRow[] {
    const list = this.getGroups(scope, similarity);
    const order = new Map(list.map((g, i) => [g, i]));
    const ayahs = new Map(list.map((g) => [g, new Set(g.members.flatMap(spanOf))]));
    const index = new Map<AyahId, MutashabihGroup[]>();
    for (const g of list) {
      for (const id of ayahs.get(g)!) {
        const l = index.get(id);
        if (l) l.push(g);
        else index.set(id, [g]);
      }
    }
    const rank = (g: MutashabihGroup) => [g.pilot ? 0 : 1, SOURCE_PRIORITY.indexOf(g.source.name), order.get(g)!];
    const before = (x: MutashabihGroup, y: MutashabihGroup) => {
      const [a, b] = [rank(x), rank(y)];
      return a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
    };
    // 1) A record whose ayahs all lie inside a larger record of this list is shown inside that record's row.
    const host = new Map<MutashabihGroup, MutashabihGroup>();
    for (const g of list) {
      const own = ayahs.get(g)!;
      const [first] = own;
      const hosts = (index.get(first) ?? []).filter((b) => {
        const other = ayahs.get(b)!;
        return b !== g && other.size > own.size && [...own].every((id) => other.has(id));
      });
      if (hosts.length) host.set(g, hosts.sort((x, y) => ayahs.get(y)!.size - ayahs.get(x)!.size || before(x, y))[0]);
    }
    const root = (g: MutashabihGroup) => {
      let r = g;
      while (host.has(r)) r = host.get(r)!; // sizes strictly grow, so this ends
      return r;
    };
    // 2) One row per normalised title (records without a title keep their own row).
    const rows = new Map<string, { roots: MutashabihGroup[]; groups: MutashabihGroup[] }>();
    for (const g of list) {
      const r = root(g);
      const key = r.title ? titleKey(r.title.text) : `#${r.id}`;
      const row = rows.get(key) ?? rows.set(key, { roots: [], groups: [] }).get(key)!;
      if (r === g) row.roots.push(g);
      row.groups.push(g);
    }
    const out: RecordRow[] = [];
    for (const [key, { roots, groups }] of rows) {
      const primary = [...roots].sort(before)[0];
      const ordered = [primary, ...groups.filter((g) => g !== primary).sort(before)];
      const ids = [...new Set(ordered.flatMap((g) => [...ayahs.get(g)!]))].sort(
        (a, b) => this.positionOf(a) - this.positionOf(b),
      );
      out.push({
        id: primary.id,
        title: groupTitle(primary),
        titleKey: key,
        groups: ordered,
        ayahIds: ids,
        statuses: STATUS_ORDER.filter((s) => ordered.some((g) => g.status === s)),
        pilot: ordered.some((g) => g.pilot),
        sources: bySourcePriority(ordered.flatMap(sourcesOf)),
        similarityType: ordered.some((g) => (g.similarityType ?? 'lafzi') === 'lafzi') ? 'lafzi' : 'semantic',
      });
    }
    return out.sort((a, b) => Math.min(...a.groups.map((g) => order.get(g)!)) - Math.min(...b.groups.map((g) => order.get(g)!)));
  }

  getAnalogues(ayahId: AyahId, scope: Scope = 'all', similarity: SimilarityFilter = 'lafzi'): Analogue[] {
    const found = new Map<AyahId, { ayahIds: AyahId[]; selfAyahIds: AyahId[]; groups: MutashabihGroup[] }>();
    const owner = new Map<AyahId, AyahId>(); // ayah -> key of the analogue that shows it
    for (const g of this.byAyah.get(ayahId) ?? []) {
      const self = g.members.find((m) => spanOf(m).includes(ayahId));
      if (!self) continue;
      for (const m of g.members) {
        if (m === self || spanOf(m).includes(ayahId)) continue;
        // One analogue per ayah: members whose spans overlap (e.g. Waqar144 [5:1, 5:2] and another source's 5:2)
        // are one analogue, never two cards showing the same ayah.
        const span = spanOf(m);
        const hits = [...new Set(span.map((id) => owner.get(id)).filter((k): k is AyahId => !!k))];
        let key = hits[0] ?? m.ayahId;
        let entry = found.get(key);
        if (!entry) {
          entry = { ayahIds: [], selfAyahIds: spanOf(self), groups: [] };
          found.set(key, entry);
        }
        for (const other of hits.slice(1)) {
          const e = found.get(other)!;
          entry.ayahIds.push(...e.ayahIds);
          entry.groups.push(...e.groups);
          found.delete(other);
        }
        if (!entry.groups.includes(g)) entry.groups.push(g);
        entry.ayahIds = [...new Set([...entry.ayahIds, ...span])].sort((a, b) => this.positionOf(a) - this.positionOf(b));
        if (key !== entry.ayahIds[0]) {
          found.delete(key);
          key = entry.ayahIds[0];
          found.set(key, entry);
        }
        for (const id of entry.ayahIds) owner.set(id, key);
      }
    }
    const rank = (g: MutashabihGroup) => SOURCE_PRIORITY.indexOf(g.source.name);
    const analogues: Analogue[] = [];
    for (const e of found.values()) {
      const groups = [...e.groups].sort((a, b) => rank(a) - rank(b));
      const pilot = groups.some((g) => g.pilot);
      if (scope === 'pilot' && !pilot) continue;
      const primary = groups[0];
      const primaryMember = primary.members.find((m) => spanOf(m).some((x) => e.ayahIds.includes(x)))!;
      const primarySelf = primary.members.find((m) => spanOf(m).includes(ayahId))!;
      const similarityType = this.pairSimilarity(primarySelf.ayahId, primaryMember.ayahId, primary);
      if (!this.policy.allowedSimilarity.includes(similarityType)) continue; // never semantic in beta/production
      if (!this.pilotAlwaysVisible(pilot, similarity) && !this.matches(similarityType, similarity)) continue;
      analogues.push({
        ayahId: primaryMember.ayahId,
        ayahIds: e.ayahIds,
        selfAyahIds: spanOf(primarySelf),
        primary,
        groups,
        status: primary.status,
        pilot,
        sources: bySourcePriority(groups.flatMap(sourcesOf)),
        similarityType,
      });
    }
    return analogues.sort((a, b) => {
      // Pilot (HifzLink) pairs first, then mushaf order.
      if (a.pilot !== b.pilot) return a.pilot ? -1 : 1;
      return this.positionOf(a.ayahId) - this.positionOf(b.ayahId);
    });
  }

  getPositionAyahIds(scope: Scope = 'all', similarity: SimilarityFilter = 'lafzi'): AyahId[] {
    return [...this.byAyah.keys()]
      .filter((id) => this.getAnalogues(id, scope, similarity).length > 0)
      .sort((a, b) => this.positionOf(a) - this.positionOf(b));
  }

  getPositionsIn(ayahIds: AyahId[], scope: Scope = 'all', similarity: SimilarityFilter = 'lafzi'): Position[] {
    const out: Position[] = [];
    for (const id of ayahIds) {
      if (!this.byAyah.has(id)) continue;
      const analogues = this.getAnalogues(id, scope, similarity);
      if (!analogues.length) continue;
      out.push({
        ayahId: id,
        analogueCount: analogues.length,
        statuses: [...new Set(analogues.map((a) => a.status))],
        pilot: analogues.some((a) => a.pilot),
        similarityType: analogues[0].similarityType,
        title: pairTitle(this.getHighlightRule(analogues[0].selfAyahIds[0], analogues[0].ayahId), analogues[0].selfAyahIds),
      });
    }
    return out.sort((a, b) => this.positionOf(a.ayahId) - this.positionOf(b.ayahId));
  }

  getHighlightRule(a: AyahId, b: AyahId): HighlightRule | undefined {
    return this.rules.get(pairKey(a, b));
  }
}
