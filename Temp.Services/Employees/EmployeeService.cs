using Temp.Database.UnitOfWork;
using Temp.Domain.Models;
using Temp.Services._Helpers;
using Temp.Services._Shared;
using Temp.Services.Employees.Exceptions;
using Temp.Services.Employees.Models.Commands;
using Temp.Services.Employees.Models.Queries;
using Temp.Services.Integrations.Azure.AzureStorage;
using Temp.Services.Integrations.Loggings;
using Temp.Services.Providers;

namespace Temp.Services.Employees;

public partial class EmployeeService : BaseService<Employee>, IEmployeeService
{
    private readonly IAzureStorageService _azureStorageService;

    public EmployeeService(
        IUnitOfWork unitOfWork,
        IMapper mapper,
        ILoggingBroker loggingBroker,
        IIdentityProvider identityProvider,
        IAzureStorageService azureStorageService)
        : base(unitOfWork, mapper, loggingBroker, identityProvider) {
        _azureStorageService = azureStorageService;
    }

    public Task<CreateEmployeeResponse> CreateEmployee(CreateEmployeeRequest request) =>
    TryCatch(async () => {
        var employee = Mapper.Map<Employee>(request);

        employee.SetAuditableInfoOnCreate(await IdentityProvider.GetCurrentUser());

        ValidateEmployeeOnCreate(employee);

        await UnitOfWork.Employees.AddAsync(employee);
        await UnitOfWork.SaveChangesAsync();

        return Mapper.Map<CreateEmployeeResponse>(employee);
    });

    public Task<GetEmployeeResponse> GetEmployee(int id) =>
    TryCatch(async () => {
        var employee = await UnitOfWork.Employees
            .QueryNoTracking()
            .Where(x => x.Id == id)
            .ProjectTo<GetEmployeeResponse>(Mapper.ConfigurationProvider)
            .FirstOrDefaultAsync();

        ValidateGetEmployee(employee);

        return employee;
    });

    public Task<PagedList<GetEmployeesResponse>> GetEmployees(GetEmployeesRequest request) =>
    TryCatch(async () => {
        var employeesQuery = UnitOfWork.Employees
            .QueryNoTracking();

        employeesQuery = ApplyEmployeeFilters(employeesQuery, request.Role, request.FirstName, request.LastName);

        var projectedQuery = employeesQuery
            .ProjectTo<GetEmployeesResponse>(Mapper.ConfigurationProvider)
            .OrderBy(x => x.FirstName);

        var employees = await PagedList<GetEmployeesResponse>.CreateAsync(
            projectedQuery,
            request.PageNumber,
            request.PageSize);

        return employees;
    });

    public Task<PagedList<GetEmployeesWithEngagementResponse>>
    GetEmployeesWithEngagement(GetEmployeesWithEngagementRequest request) =>
    TryCatch(async () => {
        IQueryable<Employee> employeesQuery = UnitOfWork.Employees
            .QueryNoTracking()
            .Where(x => x.Engagements.Any(n => n.DateTo > DateTime.UtcNow))
            .OrderByDescending(x => x.Id);

        employeesQuery = ApplyEmployeeFilters(employeesQuery, request.Role, request.FirstName, request.LastName);

        var projectedQuery = employeesQuery
            .ProjectTo<GetEmployeesWithEngagementResponse>(Mapper.ConfigurationProvider)
            .OrderBy(x => x.FirstName);

        var employees = await PagedList<GetEmployeesWithEngagementResponse>.CreateAsync(
            projectedQuery,
            request.PageNumber,
            request.PageSize);

        return employees;
    });

    public Task<PagedList<GetEmployeesWithoutEngagementResponse>>
    GetEmployeesWithoutEngagement(GetEmployeesWithoutEngagementRequest request) =>
    TryCatch(async () => {
        var currentDateTime = DateTime.UtcNow;

        var allEmployeesCount = await UnitOfWork.Employees.QueryNoTracking().CountAsync();
        Logger.LogDebug($"Total employees in DB: {allEmployeesCount}");

        IQueryable<Employee> employeesQuery = UnitOfWork.Employees
            .QueryNoTracking()
            .Where(x => !x.Engagements.Any(n => n.DateTo > currentDateTime))
            .OrderByDescending(x => x.Id);

        var filteredCount = await employeesQuery.CountAsync();
        Logger.LogDebug($"Employees without active engagement: {filteredCount}");

        employeesQuery = ApplyEmployeeFilters(employeesQuery, request.Role, request.FirstName, request.LastName);

        var projectedQuery = employeesQuery
            .ProjectTo<GetEmployeesWithoutEngagementResponse>(Mapper.ConfigurationProvider)
            .OrderBy(x => x.FirstName);

        var employees = await PagedList<GetEmployeesWithoutEngagementResponse>.CreateAsync(
            projectedQuery,
            request.PageNumber,
            request.PageSize);
            
        Logger.LogDebug($"Returning {employees.Count} employees without engagement in response page.");

        return employees;
    });

    private IQueryable<Employee> ApplyEmployeeFilters(IQueryable<Employee> query, string? role, string? firstName, string? lastName)
    {
        if (!string.IsNullOrEmpty(role))
        {
            query = query.Where(x => x.Role == role);
        }

        if (!string.IsNullOrEmpty(firstName))
        {
            query = query.Where(x => x.FirstName.Contains(firstName));
        }

        if (!string.IsNullOrEmpty(lastName))
        {
            query = query.Where(x => x.LastName.Contains(lastName));
        }

        return query;
    }

    public Task<UpdateEmployeeResponse> UpdateEmployee(UpdateEmployeeRequest request) =>
    TryCatch(async () => {
        var employee = await UnitOfWork.Employees
            .FirstOrDefaultAsync(x => x.Id == request.Id);

        string? oldProfilePictureUrl = employee.ProfilePictureUrl;

        Mapper.Map(request, employee);

        employee.SetAuditableInfoOnUpdate(await IdentityProvider.GetCurrentUser());

        ValidateEmployeeOnUpdate(employee);

        UnitOfWork.Employees.Update(employee);
        await UnitOfWork.SaveChangesAsync();

        // Delete old blob if URL changed
        if (!string.IsNullOrEmpty(oldProfilePictureUrl) &&
            oldProfilePictureUrl != request.ProfilePictureUrl) {
            try {
                await _azureStorageService.DeleteAsync(oldProfilePictureUrl);
            } catch (Exception ex) {
                Logger.LogError(ex);
            }
        }

        return new UpdateEmployeeResponse() {
            Success = true
        };
    });

    public async Task<DeleteEmployeeResponse> DeleteEmployeeAsync(int id) {
        return await TryCatch(async () => {
            var employee = await UnitOfWork.Employees.GetByIdAsync(id);

            if (employee == null) {
                throw new EmployeeNotFoundException();
            }

            string? profilePictureUrl = employee.ProfilePictureUrl;

            UnitOfWork.Employees.Remove(employee);
            await UnitOfWork.SaveChangesAsync();

            // Delete associated blob if exists
            if (!string.IsNullOrEmpty(profilePictureUrl)) {
                try {
                    await _azureStorageService.DeleteAsync(profilePictureUrl);
                } catch (Exception ex) {
                    Logger.LogError(ex);
                }
            }

            return new DeleteEmployeeResponse { Success = true };
        });
    }
}