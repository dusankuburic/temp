using System.Text.Json;
using Temp.API.Models;
using Temp.Services.Exceptions;
using UnauthorizedAccessException = Temp.Services.Exceptions.UnauthorizedAccessException;

namespace Temp.API.Middleware;

public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IHostEnvironment _env;
    private readonly ILogger<ExceptionMiddleware> _logger;

    public ExceptionMiddleware(
        RequestDelegate next,
        IHostEnvironment env,
        ILogger<ExceptionMiddleware> logger) {
        _next = next;
        _env = env;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context) {
        try {
            await _next(context);
        } catch (Exception exception) {
            await HandleExceptionAsync(context, exception);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception) {
        var errorResponse = new ErrorResponse
        {
            TraceId = context.TraceIdentifier,
            Timestamp = DateTime.UtcNow
        };

        switch (exception) {
            case ValidationException validationEx:
                _logger.LogWarning(validationEx, "Validation error occurred");
                errorResponse.StatusCode = (int)HttpStatusCode.BadRequest;
                errorResponse.Message = validationEx.Message;
                errorResponse.ErrorCode = validationEx.ErrorCode;
                errorResponse.ValidationErrors = validationEx.ValidationErrors;
                break;

            case NotFoundException notFoundEx:
                _logger.LogWarning(notFoundEx, "Resource not found");
                errorResponse.StatusCode = (int)HttpStatusCode.NotFound;
                errorResponse.Message = notFoundEx.Message;
                errorResponse.ErrorCode = notFoundEx.ErrorCode;
                break;

            case BusinessRuleException businessEx:
                _logger.LogWarning(businessEx, "Business rule violation");
                errorResponse.StatusCode = (int)HttpStatusCode.BadRequest;
                errorResponse.Message = businessEx.Message;
                errorResponse.ErrorCode = businessEx.ErrorCode;
                break;

            case AuthenticationException authEx:
                _logger.LogWarning(authEx, "Authentication failed");
                errorResponse.StatusCode = (int)HttpStatusCode.Unauthorized;
                errorResponse.Message = authEx.Message;
                errorResponse.ErrorCode = authEx.ErrorCode;
                break;

            case UnauthorizedAccessException unauthorizedEx:
                _logger.LogWarning(unauthorizedEx, "Unauthorized access attempt");
                errorResponse.StatusCode = (int)HttpStatusCode.Forbidden;
                errorResponse.Message = unauthorizedEx.Message;
                errorResponse.ErrorCode = unauthorizedEx.ErrorCode;
                break;

            case ConflictException conflictEx:
                _logger.LogWarning(conflictEx, "Conflict occurred");
                errorResponse.StatusCode = (int)HttpStatusCode.Conflict;
                errorResponse.Message = conflictEx.Message;
                errorResponse.ErrorCode = conflictEx.ErrorCode;
                break;

            case DependencyException dependencyEx:
                _logger.LogError(dependencyEx, "Dependency failure occurred");
                errorResponse.StatusCode = (int)HttpStatusCode.ServiceUnavailable;
                errorResponse.Message = "A service dependency is currently unavailable";
                errorResponse.ErrorCode = dependencyEx.ErrorCode;
                break;

            default:
                _logger.LogError(exception, "Unhandled exception occurred");
                errorResponse.StatusCode = (int)HttpStatusCode.InternalServerError;
                errorResponse.Message = _env.IsDevelopment()
                    ? exception.Message
                    : "An internal server error occurred";
                errorResponse.ErrorCode = "INTERNAL_ERROR";
                break;
        }


        if (_env.IsDevelopment()) {
            errorResponse.StackTrace = exception.StackTrace;
        }

        context.Response.StatusCode = errorResponse.StatusCode;
        context.Response.ContentType = "application/json";

        var options = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
        };

        var json = JsonSerializer.Serialize(errorResponse, options);
        await context.Response.WriteAsync(json);
    }
}