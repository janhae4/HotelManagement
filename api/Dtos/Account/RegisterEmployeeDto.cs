using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace api.Dtos.Account
{
    public class RegisterEmployeeDto
    {
        [Required]
        public required string? FirstName { get; set; }
        [Required]
        public required string? LastName { get; set; }
        [Required]
        [EmailAddress]
        public required string? Email { get; set; }
        [Required]
        [Phone]
        public required string? PhoneNumber { get; set; }
        [Required]
        public required string Password { get; set; }
        [Required]
        // [Compare("Password", ErrorMessage = "The password and confirmation password do not match.")]
        public required string? ConfirmPassword { get; set; }

        [Required] public DateTime DateOfBirth { get; set; }
        [Required] public string Role { get; set; } = "Employee";
        [Required] public string Status { get; set; } = "Active";
        [Required] public string Salary { get; set; } = string.Empty;
        [Required] public string Department { get; set; } = string.Empty;
        [Required] public string Address { get; set; } = string.Empty;
        [Required] public string ImagePath { get; set; } = string.Empty;
        [Required] public bool IsWoman { get; set; }
    }
}