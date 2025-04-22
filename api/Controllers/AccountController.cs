using api.Dtos.Account;
using api.Interfaces;
using api.Models;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using api.Data;

namespace api.Controllers
{
    [ApiController]
    [Route("api/account")]
    [EnableCors("AllowSpecificOrigin")]
    public class AccountController : ControllerBase
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly ITokenService _tokenService;
        private readonly ILogger<AccountController> _logger;
        private readonly SignInManager<AppUser> _signInManager;
        private readonly ICustomerRepository _customerRepo;
        private readonly IEmployeeRepository _employeeRepo;
        private readonly ApplicationDBContext _context;



        public AccountController(UserManager<AppUser> userManager, ITokenService tokenService, ILogger<AccountController> logger, SignInManager<AppUser> signInManager, ICustomerRepository customerRepo, IEmployeeRepository employeeRepo, ApplicationDBContext context)
        {
            _userManager = userManager;
            _tokenService = tokenService;
            _logger = logger;
            _signInManager = signInManager;
            _customerRepo = customerRepo;
            _employeeRepo = employeeRepo;
            _context = context;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var email = loginDto.Email ?? string.Empty;
            var user = await _userManager.Users.FirstOrDefaultAsync(u => u.Email != null && u.Email.ToLower() == email.ToLower());

            if (user == null)
                return Unauthorized("Email not registered");

            var result = await _signInManager.CheckPasswordSignInAsync(user, loginDto.Password, false);

            if (!result.Succeeded)
                return Unauthorized("Password is incorrect");

            var token = await _tokenService.CreateToken(user);

            return Ok(new
            {
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                PhoneNumber = user.PhoneNumber,
                Role = user.Role,
                Token = token,
            });
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto registerDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (registerDto.Password != registerDto.ConfirmPassword)
                return BadRequest("Passwords do not match");

            if (await _userManager.Users.AnyAsync(u => u.Email == registerDto.Email))
                return BadRequest("Email already exists");

            if (await _userManager.Users.AnyAsync(u => u.PhoneNumber == registerDto.PhoneNumber))
                return BadRequest("Phone number already exists");


            var appUser = new AppUser
            {
                UserName = registerDto.Email ?? string.Empty,
                Email = registerDto.Email ?? string.Empty,
                FirstName = registerDto.FirstName ?? string.Empty,
                LastName = registerDto.LastName ?? string.Empty,
                PhoneNumber = registerDto.PhoneNumber ?? string.Empty,
                Role = "Customer"
            };

            var createdUser = await _userManager.CreateAsync(appUser, registerDto.Password);

            if (!createdUser.Succeeded)
            {
                var errors = string.Join(", ", createdUser.Errors.Select(e => e.Description));
                _logger.LogError("User creation failed: {Errors}", errors);
                return StatusCode(500, createdUser.Errors);
            }

            var createdCustomer = await _customerRepo.CreateAsync(new Customer
            {
                AppUserId = appUser.Id,
                FirstName = registerDto.FirstName ?? string.Empty,
                LastName = registerDto.LastName ?? string.Empty,
                Email = registerDto.Email ?? string.Empty,
                PhoneNumber = registerDto.PhoneNumber ?? string.Empty
            });

            var token = await _tokenService.CreateToken(appUser);

            return Ok(new NewUserDto
            {
                Email = appUser.Email,
                FirstName = appUser.FirstName,
                LastName = appUser.LastName,
                PhoneNumber = appUser.PhoneNumber,
                Token = token,
                Role = appUser.Role
            });
        }

        [HttpPost("admin/create-employee")]
        public async Task<IActionResult> CreateEmployee([FromBody] RegisterEmployeeDto _registerDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (_registerDto.Password != _registerDto.ConfirmPassword)
                return BadRequest("Passwords do not match");

            var appUser = new AppUser
            {
                UserName = _registerDto.Email,
                Email = _registerDto.Email,
                FirstName = _registerDto.FirstName,
                LastName = _registerDto.LastName,
                PhoneNumber = _registerDto.PhoneNumber,
                Role = "Employee"
            };

            var createdUser = await _userManager.CreateAsync(appUser, _registerDto.Password ?? "Abc@123");

            if (!createdUser.Succeeded)
            {
                var errors = string.Join(", ", createdUser.Errors.Select(e => e.Description));
                _logger.LogError("Employee creation failed: {Errors}", errors);
                return StatusCode(500, createdUser.Errors);
            }

            var employee = new Employee
            {
                FirstName = _registerDto.FirstName,
                LastName = _registerDto.LastName,
                DateOfBirth = _registerDto.DateOfBirth,
                Role = _registerDto.Role,
                Status = _registerDto.Status,
                Salary = _registerDto.Salary,
                PhoneNumber = _registerDto.PhoneNumber,
                Email = _registerDto.Email,
                Department = _registerDto.Department,
                Address = _registerDto.Address,
                ImagePath = _registerDto.ImagePath,
                IsWoman = _registerDto.IsWoman,
                AppUser = appUser // Linking
            };

            _context.Employees.Add(employee);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                Message = "Employee account and profile created successfully.",
                appUser.Email,
                appUser.FirstName,
                appUser.LastName,
                appUser.PhoneNumber
            });
        }

        [HttpGet("{email}")]
        public async Task<IActionResult> GetByEmail([FromRoute] string email)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var customer = await _userManager.FindByEmailAsync(email);

            if (customer == null)
                return NotFound();

            return Ok(customer);
        }
    }
}
