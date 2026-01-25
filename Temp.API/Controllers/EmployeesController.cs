using Temp.Services.Employees;
using Temp.Services.Employees.Exceptions;
using Temp.Services.Employees.Models.Commands;
using Temp.Services.Employees.Models.Queries;

namespace Temp.API.Controllers;

[Authorize(Roles = "Admin")]
[Route("api/[controller]")]
[ApiController]
public class EmployeesController : ControllerBase
{
    private readonly IEmployeeService _employeeService;

    public EmployeesController(IEmployeeService employeeService) {
        _employeeService = employeeService;
    }

    [HttpGet]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(PagedList<GetEmployeesResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetEmployees([FromQuery] GetEmployeesRequest request) {
        var response = await _employeeService.GetEmployees(request);
        Response.AddPagination(response.CurrentPage, response.PageSize, response.TotalCount, response.TotalPages);

        return Ok(response);
    }

    [HttpGet("with-engagement")]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(PagedList<GetEmployeesWithEngagementResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetEmployeesWithEngagement([FromQuery] GetEmployeesWithEngagementRequest request) {
        var response = await _employeeService.GetEmployeesWithEngagement(request);
        Response.AddPagination(response.CurrentPage, response.PageSize, response.TotalCount, response.TotalPages);

        return Ok(response);
    }

    [HttpGet("without-engagement")]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(PagedList<GetEmployeesWithoutEngagementResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetEmployeesWithoutEngagement([FromQuery] GetEmployeesWithoutEngagementRequest request) {
        var response = await _employeeService.GetEmployeesWithoutEngagement(request);
        Response.AddPagination(response.CurrentPage, response.PageSize, response.TotalCount, response.TotalPages);

        return Ok(response);
    }

    [HttpGet("{id}")]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(GetEmployeesResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetEmployee([FromRoute] int id) {
        var response = await _employeeService.GetEmployee(id);

        return Ok(response);
    }

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(CreateEmployeeResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> Create([FromBody] CreateEmployeeRequest request) {
        var response = await _employeeService.CreateEmployee(request);

        return Ok(response);
    }

    [HttpPut("{id}")]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> UpdateEmployee([FromRoute] int id, [FromBody] UpdateEmployeeRequest request) {
        if (request.Id != 0 && request.Id != id) {
            return BadRequest("Route id and payload id must match.");
        }

        request.Id = id;

        await _employeeService.UpdateEmployee(request);

        return NoContent();
    }

    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteEmployee([FromRoute] int id) {
        await _employeeService.DeleteEmployeeAsync(id);
        return NoContent();
    }

}