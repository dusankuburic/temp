using Temp.Domain.Models.Identity;
using Temp.Services.Auth.Exceptions;

namespace Temp.Services.Auth;

public partial class AuthService
{
    private void ValidateUserOnCreate(AppUser user) {
        ValidateUserIsNull(user);
        ValidateUserIdIsNull(user.Id);
        ValidateUserFields(user);
    }


    private void ValidateUserOnModify(AppUser user) {
        ValidateUserIsNull(user);
        ValidateUserIdIsNull(user.Id);
        ValidateUserFields(user);
    }

    private static void ValidateUserFields(AppUser user) {
        if (IsInvalid(user.UserName)) {
            throw new InvalidUserException(
                parameterName: nameof(AppUser.UserName),
                parameterValue: user.UserName);
        }
        if (IsInvalid(user.DisplayName)) {
            throw new InvalidUserException(
                parameterName: nameof(AppUser.DisplayName),
                parameterValue: user.DisplayName);
        }
    }


    private static void ValidateUserIdIsNull(string userId) {
        if (userId == null) {
            throw new InvalidUserException(
                parameterName: nameof(AppUser.Id),
                parameterValue: userId);
        }
    }

    private static void ValidateUserIsNull(AppUser user) {
        if (user is null)
            throw new NullUserException();
    }

    private static bool IsInvalid(string input) => string.IsNullOrWhiteSpace(input);
}