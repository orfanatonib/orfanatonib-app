import { digitsOnly } from "@/utils/masks";
import { GOOGLE_MAPS_SEARCH_URL, SHELTERED_MESSAGES } from "./constants";
import { ShelteredGender, ShelteredOrderBy, SortOrder } from "./enums";
import type { ShelterSimpleResponseDto } from "@/features/shelters/types";
import type {
  AuthUser,
  CreateShelteredForm,
  EditShelteredForm,
  ShelteredAddressForm,
  ShelteredAddressResponseDto,
  ShelteredFilters,
  ShelteredResponseDto,
  ShelteredSort,
  ShelterOption,
} from "./types";

const BR_DATE_PATTERN = /^(\d{2})\/(\d{2})\/(\d{4})$/;
const ISO_DATE_PATTERN = /^(\d{4,})-(\d{2})-(\d{2})$/;

/** Flattens the backend `message`, which may be a string or a list of strings. */
export const normalizeBackendMessage = (message: unknown): string => {
  if (Array.isArray(message)) {
    return message.filter((part): part is string => typeof part === "string").join("\n");
  }
  return typeof message === "string" ? message : "";
};

type AxiosLikeError = {
  response?: { data?: { message?: unknown } };
  message?: unknown;
};

/** Reads the API error envelope, falling back to the network error message. */
export const extractApiErrorMessage = (error: unknown, fallback: string): string => {
  const candidate = error as AxiosLikeError | null;
  const backendMessage = normalizeBackendMessage(candidate?.response?.data?.message);
  if (backendMessage) return backendMessage;
  if (typeof candidate?.message === "string" && candidate.message) return candidate.message;
  return fallback;
};

/**
 * Accepts `DD/MM/AAAA` or `AAAA-MM-DD` and returns the ISO calendar date the
 * API expects. `null` and `undefined` are preserved so the caller can tell an
 * explicit clear apart from an untouched field.
 */
export const normalizeIsoDateString = (
  input?: string | null,
): string | null | undefined => {
  if (input === null) return null;
  if (input === undefined) return undefined;

  const raw = input.trim();
  if (!raw) return null;

  const brazilian = BR_DATE_PATTERN.exec(raw);
  if (brazilian) {
    const [, day, month, year] = brazilian;
    return `${year}-${month}-${day}`;
  }

  const iso = ISO_DATE_PATTERN.exec(raw);
  if (iso) {
    const [, year, month, day] = iso;
    return `${year.length > 4 ? year.slice(-4) : year}-${month}-${day}`;
  }

  return raw;
};

/** True when the string is a real calendar date in `AAAA-MM-DD`. */
export const isValidIsoDate = (value: string): boolean => {
  const match = ISO_DATE_PATTERN.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (month < 1 || month > 12 || day < 1 || day > 31) return false;

  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
};

/** Strips the mask from phone and postal code before sending them upstream. */
export const normalizeAddressForm = (
  address?: ShelteredAddressForm | null,
): ShelteredAddressForm | null | undefined => {
  if (address === null || address === undefined) return address;
  return { ...address, postalCode: digitsOnly(address.postalCode) };
};

export const sortToQuery = (
  sort?: ShelteredSort | null,
): { orderBy: ShelteredOrderBy; order: SortOrder } => ({
  orderBy: sort?.id ?? ShelteredOrderBy.NAME,
  order: sort?.desc ? SortOrder.DESC : SortOrder.ASC,
});

const hasText = (value?: string): value is string => Boolean(value?.trim());

/**
 * Drops blank filters so the request never sends an empty value the API would
 * treat as a real filter.
 */
export const compactFilters = (filters?: ShelteredFilters): ShelteredFilters => {
  if (!filters) return {};

  const compacted: ShelteredFilters = {};
  if (hasText(filters.searchString)) compacted.searchString = filters.searchString.trim();
  if (hasText(filters.shelterSearchingString)) {
    compacted.shelterSearchingString = filters.shelterSearchingString.trim();
  }
  if (hasText(filters.addressFilter)) compacted.addressFilter = filters.addressFilter.trim();
  if (hasText(filters.shelterId)) compacted.shelterId = filters.shelterId;
  if (filters.gender) compacted.gender = filters.gender;
  if (hasText(filters.birthDateFrom)) compacted.birthDateFrom = filters.birthDateFrom;
  if (hasText(filters.birthDateTo)) compacted.birthDateTo = filters.birthDateTo;
  if (hasText(filters.joinedFrom)) compacted.joinedFrom = filters.joinedFrom;
  if (hasText(filters.joinedTo)) compacted.joinedTo = filters.joinedTo;

  return compacted;
};

export const hasActiveFilters = (filters: ShelteredFilters): boolean =>
  Object.keys(compactFilters(filters)).length > 0;

/** Builds the create payload with dates and masks already normalized. */
export const buildCreatePayload = (form: CreateShelteredForm): CreateShelteredForm => ({
  ...form,
  birthDate: normalizeIsoDateString(form.birthDate) ?? null,
  joinedAt: normalizeIsoDateString(form.joinedAt) ?? null,
  guardianPhone: form.guardianPhone ? digitsOnly(form.guardianPhone) : form.guardianPhone,
  address: normalizeAddressForm(form.address),
  shelterId: form.shelterId ?? null,
});

/** Builds the update payload, preserving "field was not touched" semantics. */
export const buildUpdatePayload = (
  form: Omit<EditShelteredForm, "id">,
): Omit<EditShelteredForm, "id"> => {
  const payload: Omit<EditShelteredForm, "id"> = { ...form };

  if (form.birthDate !== undefined) {
    payload.birthDate = normalizeIsoDateString(form.birthDate);
  }
  if (form.joinedAt !== undefined) {
    payload.joinedAt = normalizeIsoDateString(form.joinedAt);
  }
  if (form.guardianPhone !== undefined && form.guardianPhone !== null) {
    payload.guardianPhone = digitsOnly(form.guardianPhone);
  }
  if (form.address !== undefined) {
    payload.address = normalizeAddressForm(form.address);
  }

  return payload;
};

export type DateValidationResult = { valid: true } | { valid: false; message: string };

const VALID: DateValidationResult = { valid: true };

/** Create requires a real birth date; the joined date stays optional. */
export const validateCreateDates = (
  form: CreateShelteredForm,
): DateValidationResult => {
  const birthDate = normalizeIsoDateString(form.birthDate);
  if (!birthDate || !isValidIsoDate(birthDate)) {
    return { valid: false, message: SHELTERED_MESSAGES.INVALID_BIRTH_DATE };
  }

  const joinedAt = normalizeIsoDateString(form.joinedAt);
  if (joinedAt && !isValidIsoDate(joinedAt)) {
    return { valid: false, message: SHELTERED_MESSAGES.INVALID_JOINED_AT };
  }

  return VALID;
};

/** Update only validates the date fields that were actually supplied. */
export const validateUpdateDates = (
  form: Omit<EditShelteredForm, "id">,
): DateValidationResult => {
  if (form.birthDate !== undefined) {
    const birthDate = normalizeIsoDateString(form.birthDate);
    if (!birthDate || !isValidIsoDate(birthDate)) {
      return { valid: false, message: SHELTERED_MESSAGES.INVALID_BIRTH_DATE };
    }
  }

  if (form.joinedAt !== undefined) {
    const joinedAt = normalizeIsoDateString(form.joinedAt);
    if (joinedAt && !isValidIsoDate(joinedAt)) {
      return { valid: false, message: SHELTERED_MESSAGES.INVALID_JOINED_AT };
    }
  }

  return VALID;
};

export const formatAddressLine = (
  address?: ShelteredAddressResponseDto | null,
): string =>
  address
    ? [
        address.street,
        address.number,
        address.district,
        address.city,
        address.state,
        address.postalCode,
      ]
        .filter((part): part is string => Boolean(part))
        .join(", ")
    : "";

export const buildMapsUrl = (
  address?: ShelteredAddressResponseDto | null,
): string | undefined => {
  const line = formatAddressLine(address);
  return line ? `${GOOGLE_MAPS_SEARCH_URL}${encodeURIComponent(line)}` : undefined;
};

export const shortAddressLabel = (
  address?: ShelteredAddressResponseDto | null,
): string => (address ? `${address.city} / ${address.state}` : "—");

export const isFemale = (sheltered: Pick<ShelteredResponseDto, "gender">): boolean =>
  sheltered.gender === ShelteredGender.FEMALE;

/** Turns a display name into a stable kebab-case `data-testid` suffix. */
export const toTestIdSuffix = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

/**
 * The shelter a member is attached to, either through their team or directly
 * on the profile.
 */
export const resolveMemberShelter = (
  user: AuthUser | null | undefined,
): ShelterOption | null => {
  const profile = user?.memberProfile;
  if (!profile) return null;

  const teamShelter = profile.team?.shelter;
  if (teamShelter?.id) return { id: teamShelter.id, name: teamShelter.name };

  const directShelter = profile.shelter;
  if (directShelter?.id) return { id: directShelter.id, name: directShelter.name };

  return null;
};

/** The first shelter a leader is responsible for, used as the form default. */
export const resolveLeaderShelter = (
  user: AuthUser | null | undefined,
): ShelterOption | null => {
  const profile = user?.leaderProfile;
  if (!profile) return null;

  const fromTeams = profile.teams?.find((team) => team.shelter?.id)?.shelter;
  if (fromTeams?.id) return { id: fromTeams.id, name: fromTeams.name };

  const fromTeam = profile.team?.shelter;
  if (fromTeam?.id) return { id: fromTeam.id, name: fromTeam.name };

  return null;
};

/** Finds, among the shelters returned by the API, the one this member belongs to. */
export const findShelterOfMember = (
  shelters: ReadonlyArray<ShelterSimpleResponseDto>,
  memberProfileId: string | undefined,
  userId: string | undefined,
): ShelterOption | null => {
  const match = shelters.find((shelter) =>
    shelter.teams?.some((team) =>
      team.members?.some(
        (member) => member.id === memberProfileId || member.user?.id === userId,
      ),
    ),
  );

  return match ? { id: match.id, name: match.name } : null;
};
