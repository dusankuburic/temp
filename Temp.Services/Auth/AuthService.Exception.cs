using Temp.Domain.Models.Identity;
using Temp.Services.Auth.Exceptions;
using Temp.Services.Auth.Models.Commands;
using Temp.Services.Exceptions;

namespace Temp.Services.Auth;

public partial class AuthService
{
    public delegate Task<LoginAppUserResponse> ReturningRegisterAppUserFunction();
    public delegate Task<AppUser> ReturningAppUserFunction();

    private async Task<LoginAppUserResponse> TryCatch(ReturningRegisterAppUserFunction returningRegisterAppUserFunction) {
        try {
            return await returningRegisterAppUserFunction();
        } catch (AuthenticationException authenticationException) {
            throw authenticationException; // Let it bubble up as is
        } catch (NullUserException nullUserException) {
            throw CreateAndLogValidationException(nullUserException);
        } catch (InvalidUserException invalidUserException) {
            throw CreateAndLogValidationException(invalidUserException);
        } catch (SqlException sqlException) {
            throw CreateAndLogCriticalDependencyException(sqlException);
        } catch (Exception exception) {
            throw CreateAndLogServiceException(exception);
        }
    }

    private async Task<AppUser> TryCatch(ReturningAppUserFunction returningAppUserFunction) {
        try {
            return await returningAppUserFunction();
        } catch (AuthenticationException authenticationException) {
            throw authenticationException; // Let it bubble up as is
        } catch (NullUserException nullUserException) {
            throw CreateAndLogValidationException(nullUserException);
        } catch (InvalidUserException invalidUserException) {
            throw CreateAndLogValidationException(invalidUserException);
        } catch (SqlException sqlException) {
            throw CreateAndLogCriticalDependencyException(sqlException);
        } catch (Exception exception) {
            throw CreateAndLogServiceException(exception);
        }
    }

    private UserServiceException CreateAndLogServiceException(Exception exception) {
        var userServiceException = new UserServiceException(exception);
        Logger.LogError(userServiceException);
        return userServiceException;
    }

    private UserValidationException CreateAndLogValidationException(Exception exception) {
        var userValidationException = new UserValidationException(exception);
        Logger.LogError(userValidationException);
        return userValidationException;
    }

    private UserDependencyException CreateAndLogCriticalDependencyException(Exception exception) {
        var userDependencyException = new UserDependencyException(exception);
        Logger.LogError(userDependencyException);
        return userDependencyException;
    }
}