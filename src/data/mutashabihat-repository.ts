import type { VisibilityPolicy } from '@/config/flavor';
import type {
  HighlightRule,
  MutashabihGroup,
  MutashabihMember,
  MutashabihatDataset,
  ReviewStatus,
  SourceName,
} from '@/domain/mutashabihat';
import type { AyahId } from '@/domain/quran';

export type Scope = 'all' | 'pilot';

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
};

export type DatasetInfo = {
  kind: MutashabihatDataset['kind'];
  datasetVersion: number;
  groupCount: number;
  pilotCount: number;
  statusCounts: Record<ReviewStatus, number>;
};

export interface MutashabihatRepository {
  readonly policy: VisibilityPolicy;
  getDatasetInfo(): DatasetInfo;
  /** Visible groups (already filtered by the build flavor's policy). */
  getGroups(scope?: Scope): MutashabihGroup[];
  getAnalogues(ayahId: AyahId, scope?: Scope): Analogue[];
  /** Ayah ids (mushaf order) that have at least one visible analogue. */
  getPositionAyahIds(scope?: Scope): AyahId[];
  /** Data-driven highlight rule for a pair (QMT-26), if one is visible. */
  getHighlightRule(a: AyahId, b: AyahId): HighlightRule | undefined;
}

export const SOURCE_PRIORITY: SourceName[] = ['hifzlink', 'waqar144', 'quranpedia'];

export class DatasetPolicyError extends Error {}

const spanOf = (m: MutashabihMember): AyahId[] => m.ayahIds ?? [m.ayahId];
const pairKey = (a: AyahId, b: AyahId) => (a < b ? `${a}|${b}` : `${b}|${a}`);

/**
 * Flavor-aware repository over a bundled dataset. Filtering happens here, at the repository layer,
 * so non-visible records never reach the UI (QMT-48 / DAT-06).
 */
export class LocalMutashabihatRepository implements MutashabihatRepository {
  private readonly groups: MutashabihGroup[];
  private readonly byAyah = new Map<AyahId, MutashabihGroup[]>();
  private readonly rules = new Map<string, HighlightRule>();

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
    this.groups = dataset.groups.filter((g) => visible(g.status));
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
      if (visible(r.status)) this.rules.set(pairKey(r.pair[0], r.pair[1]), r);
    }
  }

  getDatasetInfo(): DatasetInfo {
    const statusCounts: Record<ReviewStatus, number> = { draft: 0, under_review: 0, approved: 0, rejected: 0 };
    for (const g of this.groups) statusCounts[g.status]++;
    return {
      kind: this.dataset.kind,
      datasetVersion: this.dataset.datasetVersion,
      groupCount: this.groups.length,
      pilotCount: this.groups.filter((g) => g.pilot).length,
      statusCounts,
    };
  }

  getGroups(scope: Scope = 'all'): MutashabihGroup[] {
    return scope === 'pilot' ? this.groups.filter((g) => g.pilot) : this.groups;
  }

  getAnalogues(ayahId: AyahId, scope: Scope = 'all'): Analogue[] {
    const found = new Map<AyahId, { ayahIds: AyahId[]; selfAyahIds: AyahId[]; groups: MutashabihGroup[] }>();
    for (const g of this.byAyah.get(ayahId) ?? []) {
      const self = g.members.find((m) => spanOf(m).includes(ayahId));
      if (!self) continue;
      for (const m of g.members) {
        if (m === self || spanOf(m).includes(ayahId)) continue;
        const entry = found.get(m.ayahId);
        if (entry) entry.groups.push(g);
        else found.set(m.ayahId, { ayahIds: spanOf(m), selfAyahIds: spanOf(self), groups: [g] });
      }
    }
    const rank = (g: MutashabihGroup) => SOURCE_PRIORITY.indexOf(g.source.name);
    const analogues: Analogue[] = [];
    for (const [id, e] of found) {
      const groups = [...e.groups].sort((a, b) => rank(a) - rank(b));
      const pilot = groups.some((g) => g.pilot);
      if (scope === 'pilot' && !pilot) continue;
      const primary = groups[0];
      const primaryMember = primary.members.find((m) => m.ayahId === id)!;
      const primarySelf = primary.members.find((m) => spanOf(m).includes(ayahId))!;
      analogues.push({
        ayahId: id,
        ayahIds: spanOf(primaryMember) ?? e.ayahIds,
        selfAyahIds: spanOf(primarySelf) ?? e.selfAyahIds,
        primary,
        groups,
        status: primary.status,
        pilot,
        sources: [...new Set(groups.map((g) => g.source.name))],
      });
    }
    return analogues.sort((a, b) => {
      // Pilot (HifzLink) pairs first, then mushaf order.
      if (a.pilot !== b.pilot) return a.pilot ? -1 : 1;
      return this.positionOf(a.ayahId) - this.positionOf(b.ayahId);
    });
  }

  getPositionAyahIds(scope: Scope = 'all'): AyahId[] {
    const ids = new Set<AyahId>();
    for (const g of this.getGroups(scope)) for (const m of g.members) for (const id of spanOf(m)) ids.add(id);
    return [...ids].sort((a, b) => this.positionOf(a) - this.positionOf(b));
  }

  getHighlightRule(a: AyahId, b: AyahId): HighlightRule | undefined {
    return this.rules.get(pairKey(a, b));
  }
}
