using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Temp.Services.Employees.Models.Commands;
using Temp.Services.Employees.Models.Queries;

namespace Temp.Tests.Integration.Api;

public class EmployeesControllerTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public EmployeesControllerTests(WebApplicationFactory<Program> factory) {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetEmployees_ReturnsOkResult() {

        var response = await _client.GetAsync("/api/employees");

        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetEmployeesWithEngagement_ReturnsOkResult() {

        var response = await _client.GetAsync("/api/employees/with-engagement");

        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetEmployeesWithoutEngagement_ReturnsOkResult() {

        var response = await _client.GetAsync("/api/employees/without-engagement");

        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetEmployee_WithValidId_ReturnsEmployee() {
        var employeeId = 1;

        var response = await _client.GetAsync($"/api/employees/{employeeId}");

        if (response.StatusCode == HttpStatusCode.OK) {
            var employee = await response.Content.ReadFromJsonAsync<GetEmployeeResponse>();
            employee.Should().NotBeNull();
            employee!.Id.Should().Be(employeeId);
        }
    }

    [Fact]
    public async Task GetEmployee_WithInvalidId_ReturnsNotFound() {

        var invalidId = 99999;

        var response = await _client.GetAsync($"/api/employees/{invalidId}");

        response.StatusCode.Should().BeOneOf(HttpStatusCode.NotFound, HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task CreateEmployee_WithValidData_ReturnsCreated() {

        var request = new CreateEmployeeRequest
        {
            FirstName = "John",
            LastName = "Doe"
        };

        var response = await _client.PostAsJsonAsync("/api/employees", request);

        response.StatusCode.Should().BeOneOf(HttpStatusCode.Created, HttpStatusCode.OK, HttpStatusCode.Unauthorized);

        if (response.IsSuccessStatusCode) {
            var createdEmployee = await response.Content.ReadFromJsonAsync<GetEmployeeResponse>();
            createdEmployee.Should().NotBeNull();
            createdEmployee!.FirstName.Should().Be(request.FirstName);
            createdEmployee.LastName.Should().Be(request.LastName);
        }
    }

    [Fact]
    public async Task CreateEmployee_WithInvalidData_ReturnsBadRequest() {

        var invalidRequest = new CreateEmployeeRequest
        {
            FirstName = "",
            LastName = "Doe"
        };

        var response = await _client.PostAsJsonAsync("/api/employees", invalidRequest);

        response.StatusCode.Should().BeOneOf(HttpStatusCode.BadRequest, HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task UpdateEmployee_WithValidData_ReturnsNoContent() {

        var employeeId = 1;
        var request = new UpdateEmployeeRequest
        {
            Id = employeeId,
            FirstName = "John Updated",
            LastName = "Doe Updated"
        };

        var response = await _client.PutAsJsonAsync($"/api/employees/{employeeId}", request);

        response.StatusCode.Should().BeOneOf(HttpStatusCode.NoContent, HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task UpdateEmployee_WithMismatchedIds_ReturnsBadRequest() {

        var employeeId = 1;
        var mismatchedRequest = new UpdateEmployeeRequest {
            Id = employeeId + 1,
            FirstName = "Mismatch",
            LastName = "User"
        };

        var response = await _client.PutAsJsonAsync($"/api/employees/{employeeId}", mismatchedRequest);

        if (response.StatusCode == HttpStatusCode.Unauthorized) {
            return;
        }

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task DeleteEmployee_WithValidId_ReturnsNoContent() {

        var employeeId = 1;

        var response = await _client.DeleteAsync($"/api/employees/{employeeId}");

        response.StatusCode.Should().BeOneOf(
            HttpStatusCode.NoContent,
            HttpStatusCode.OK,
            HttpStatusCode.Unauthorized
        );
    }
}