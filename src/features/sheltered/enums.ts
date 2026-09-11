/** Mirrors `ShelteredGender` in the API. */
export enum ShelteredGender {
  MALE = "M",
  FEMALE = "F",
}

/** Allowlist accepted by `GET /sheltered?orderBy=`. */
export enum ShelteredOrderBy {
  NAME = "name",
  BIRTH_DATE = "birthDate",
  JOINED_AT = "joinedAt",
  CREATED_AT = "createdAt",
  UPDATED_AT = "updatedAt",
}

export enum SortOrder {
  ASC = "ASC",
  DESC = "DESC",
}

/** Filters accepted by `GET /sheltered/simple`. */
export enum AcceptedJesusFilter {
  ACCEPTED = "accepted",
  NOT_ACCEPTED = "not_accepted",
  ALL = "all",
}

export enum ShelteredActiveFilter {
  ACTIVE = "active",
  INACTIVE = "inactive",
  ALL = "all",
}

export enum ShelteredFormMode {
  CREATE = "create",
  EDIT = "edit",
}

export enum DateFilterMode {
  SINGLE = "single",
  RANGE = "range",
}
