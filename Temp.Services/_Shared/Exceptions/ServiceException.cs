namespace Temp.Services.Exceptions;

public abstract class ServiceException : Exception
{
    public string ErrorCode { get; }
    public Dictionary<string, string[]>? ValidationErrors { get; }

    protected ServiceException(string message, string errorCode, Exception? innerException = null)
        : base(message, innerException) {
        ErrorCode = errorCode;
    }

    protected ServiceException(string message, string errorCode, Dictionary<string, string[]> validationErrors)
        : base(message) {
        ErrorCode = errorCode;
        ValidationErrors = validationErrors;
    }
}

public class ValidationException : ServiceException
{
    public ValidationException(string message, Dictionary<string, string[]> validationErrors)
        : base(message, "VALIDATION_ERROR", validationErrors) {
    }

    public ValidationException(string message, string fieldName, string error)
        : base(message, "VALIDATION_ERROR", new Dictionary<string, string[]>
        {
            { fieldName, new[] { error } }
        }) {
    }
}

public class NotFoundException : ServiceException
{
    public NotFoundException(string resourceName, object key)
        : base($"{resourceName} with key '{key}' was not found", "NOT_FOUND") {
    }

    public NotFoundException(string message)
        : base(message, "NOT_FOUND") {
    }
}

public class BusinessRuleException : ServiceException
{
    public BusinessRuleException(string message)
        : base(message, "BUSINESS_RULE_VIOLATION") {
    }

    public BusinessRuleException(string message, Exception innerException)
        : base(message, "BUSINESS_RULE_VIOLATION", innerException) {
    }
}

public class DependencyException : ServiceException
{
    public DependencyException(string message, Exception innerException)
        : base(message, "DEPENDENCY_ERROR", innerException) {
    }
}

    public class UnauthorizedAccessException : ServiceException
    {
        public UnauthorizedAccessException(string message)
            : base(message, "UNAUTHORIZED") {
        }
    }

    public class AuthenticationException : ServiceException
    {
        public AuthenticationException(string message)
            : base(message, "AUTHENTICATION_FAILED") {
        }

        public AuthenticationException(string message, Exception innerException)
            : base(message, "AUTHENTICATION_FAILED", innerException) {
        }
    }

    public class ConflictException : ServiceException
{
    public ConflictException(string message)
        : base(message, "CONFLICT") {
    }

    public ConflictException(string message, Exception innerException)
        : base(message, "CONFLICT", innerException) {
    }
}