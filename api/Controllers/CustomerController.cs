using api.Data;
using api.Dtos.Customer;
using api.Helpers;
using api.Interfaces;
using api.Mappers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Cors;

namespace api.Controllers
{
    [Route("api/customer")]
    [EnableCors("AllowSpecificOrigin")]
    [ApiController]
    public class CustomerController(ApplicationDBContext context, ICustomerRepository customerRepo) : ControllerBase
    {
        private readonly ApplicationDBContext _context = context;
        private readonly ICustomerRepository _customerRepo = customerRepo;

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] CustomerQueryObject query)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var customers = await _customerRepo.GetAllAsync(query);

            var customerDtos = customers.Where(s => s.Bookings.Any(b => b.Status != "Canceled" && b.Status != "Checked Out")).Select(s => s.ToCustomerDto()).ToList();

            return Ok(customerDtos);
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById([FromRoute] int id)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var customer = await _customerRepo.GetByIdAsync(id);

            if (customer == null)
                return NotFound();

            return Ok(customer.ToCustomerDto());
        }

        [HttpGet("{email}")]
        public async Task<IActionResult> GetByEmail([FromRoute] string email)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var customer = await _customerRepo.GetByEmailAsync(email);

            if (customer == null)
                return NotFound();

            return Ok(customer.ToCustomerDto());
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromForm] CreateCustomerDto customerDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var customerModel = customerDto.ToCustomerFromCreateDto();

            await _customerRepo.CreateAsync(customerModel);

            return CreatedAtAction(nameof(GetById), new { id = customerModel.Id }, customerModel.ToCustomerDto());
        }

        [HttpPut]
        [Route("{id:int}")]
        public async Task<IActionResult> Update([FromRoute] int id, [FromBody] UpdateCustomerDto updateDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var customerModel = await _customerRepo.UpdateAsync(id, updateDto);

            if (customerModel == null)
                return NotFound();

            return Ok(customerModel.ToCustomerDto());
        }

        [HttpDelete]
        [Route("{id:int}")]
        public async Task<IActionResult> Delete([FromRoute] int id)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var customerModel = await _customerRepo.DeleteAsync(id);

            if (customerModel == null)
                return NotFound();

            return NoContent();
        }
    }
}