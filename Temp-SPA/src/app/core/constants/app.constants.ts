export class UserRoles {
  static readonly ADMIN = 'Admin';
  static readonly USER = 'User';
  static readonly MODERATOR = 'Moderator';

  static readonly ALL_ROLES = [
    UserRoles.ADMIN,
    UserRoles.USER,
    UserRoles.MODERATOR
  ];
}

export class AppConstants {
  static readonly DEFAULT_PAGE_SIZE = 10;
  static readonly MAX_PAGE_SIZE = 100;
}
