namespace Temp.Services._Shared;

public static class ErrorCodes
{

    public const string ValidationError = "VALIDATION_ERROR";
    public const string InvalidInput = "INVALID_INPUT";
    public const string RequiredField = "REQUIRED_FIELD";

    public const string NotFound = "NOT_FOUND";
    public const string EmployeeNotFound = "EMPLOYEE_NOT_FOUND";
    public const string TeamNotFound = "TEAM_NOT_FOUND";
    public const string GroupNotFound = "GROUP_NOT_FOUND";
    public const string OrganizationNotFound = "ORGANIZATION_NOT_FOUND";
    public const string WorkplaceNotFound = "WORKPLACE_NOT_FOUND";
    public const string EngagementNotFound = "ENGAGEMENT_NOT_FOUND";

    public const string BusinessRuleViolation = "BUSINESS_RULE_VIOLATION";
    public const string DuplicateEntry = "DUPLICATE_ENTRY";
    public const string InvalidOperation = "INVALID_OPERATION";
    public const string InvalidState = "INVALID_STATE";

    public const string Unauthorized = "UNAUTHORIZED";
    public const string Forbidden = "FORBIDDEN";
    public const string AccessDenied = "ACCESS_DENIED";

    public const string InternalError = "INTERNAL_ERROR";
    public const string DependencyError = "DEPENDENCY_ERROR";
    public const string DatabaseError = "DATABASE_ERROR";
    public const string ExternalServiceError = "EXTERNAL_SERVICE_ERROR";

    public const string Conflict = "CONFLICT";
    public const string ConcurrencyConflict = "CONCURRENCY_CONFLICT";
}

public static class ErrorMessages
{

    public const string UnexpectedError = "An unexpected error occurred. Please try again later.";
    public const string InvalidRequest = "The request is invalid.";

    public const string EntityNotFound = "{0} with ID '{1}' was not found.";
    public const string ResourceNotFound = "The requested resource was not found.";

    public const string FieldRequired = "The {0} field is required.";
    public const string FieldInvalid = "The {0} field is invalid.";
    public const string FieldTooLong = "The {0} field must not exceed {1} characters.";
    public const string FieldTooShort = "The {0} field must be at least {1} characters.";

    public const string NotAuthorized = "You are not authorized to perform this action.";
    public const string AccessDenied = "Access denied.";

    public static string FormatNotFound(string entityName, object id) =>
        string.Format(EntityNotFound, entityName, id);
}


public static class AppConstants
{
    public const int DefaultPageSize = 10;
    public const int MaxPageSize = 100;
    public const int DefaultPage = 1;

    public const int MaxNameLength = 100;
    public const int MaxDescriptionLength = 500;
    public const int MaxEmailLength = 256;
    public const int MaxPhoneLength = 20;

    public const string CacheKeyPrefix = "temp_";
    public const int DefaultCacheMinutes = 5;

    public const string AdminRole = "Admin";
    public const string UserRole = "User";
    public const string ModeratorRole = "Moderator";

    public static readonly string[] AllowedRoles = new[] { AdminRole, UserRole, ModeratorRole };
}