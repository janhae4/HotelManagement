using api.Data;
using api.Dtos.Booking;
using api.Interfaces;
using api.Mappers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Cors;

namespace api.Controllers
{
  [ApiController]
  [Route("api/[controller]")]
  [EnableCors("AllowSpecificOrigin")]
  public class BookingController(ApplicationDBContext context, IBookingRepository bookingRepo, ICustomerRepository customerRepo, IRoomRepository roomRepo) : ControllerBase
  {
    private readonly ApplicationDBContext _context = context;
    private readonly IBookingRepository _bookingRepo = bookingRepo;
    private readonly ICustomerRepository _customerRepo = customerRepo;
    private readonly IRoomRepository _roomRepo = roomRepo;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
      if (!ModelState.IsValid)
        return BadRequest(ModelState);

      var bookings = await _bookingRepo.GetAllAsync();

      var bookingDtos = bookings.Select(s => s.ToBookingDto()).ToList();

      return Ok(bookingDtos);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
      var booking = await _bookingRepo.GetByIdAsync(id);

      if (booking == null)
        return NotFound("Booking not found.");

      return Ok(booking.ToBookingDto());
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromForm] CreateBookingDto bookingDto)
    {
      if (!ModelState.IsValid)
        return BadRequest(ModelState);

      var customer = await _customerRepo.GetByIdAsync(bookingDto.CustomerId);
      var room = await _roomRepo.GetByIdAsync(bookingDto.RoomId);


      var totalAmount = 0;
      if (bookingDto.CheckInDate != null && bookingDto.CheckOutDate != null)
      {
        totalAmount = room?.RoomPrice * (bookingDto.CheckOutDate.Value.Date - bookingDto.CheckInDate.Value.Date).Days ?? 0;
      }

      if (customer == null || room == null)
        return NotFound("Customer or Room not found.");

      var booking = bookingDto.ToBookingFromCreateDto();

      booking.Customer = customer;
      booking.Room = room;
      booking.TotalAmount = totalAmount;

      await _bookingRepo.CreateAsync(booking);

      return CreatedAtAction(nameof(GetById), new { id = booking.Id }, booking.ToBookingDto());
    }

    [HttpGet("{email}")]
    public async Task<IActionResult> GetByCustomerEmail(string email)
    {
      var bookings = await _bookingRepo.GetByEmailAsync(email);

      if (bookings == null)
      {
        return NotFound(new { message = "Booking not found for the provided email" });
      }

      var bookingDtos = bookings.Select(s => s.ToBookingDto()).ToList();
      return Ok(bookingDtos); 
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromForm] UpdateBookingDto bookingDto)
    {
      if (!ModelState.IsValid)
        return BadRequest(ModelState);

      await _bookingRepo.UpdateAsync(id, bookingDto);

      return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
      var booking = await _bookingRepo.DeleteAsync(id);
      if (booking == null)
        return NotFound();
      return NoContent();
    }

    [HttpGet("today-check-in")]
    public async Task<IActionResult> TodayCheckIn()
    {
      var count = await _bookingRepo.TodayCheckIn();
      return Ok(count);
    }

    [HttpGet("today-check-out")]
    public async Task<IActionResult> TodayCheckOut()
    {
      var count = await _bookingRepo.TodayCheckOut();
      return Ok(count);
    }

    [HttpGet("reservation")]
    public async Task<IActionResult> Reservation()
    {
      var count = await _bookingRepo.Reservation();
      return Ok(count);
    }
  }
}