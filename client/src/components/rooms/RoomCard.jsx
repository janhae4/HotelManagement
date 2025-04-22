import React, { useEffect, useState } from "react";
import KingBedIcon from "@mui/icons-material/KingBed";
import PersonIcon from "@mui/icons-material/Person";
import InfoIcon from "@mui/icons-material/Info";
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Menu,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const RoomCard = ({
  roomTitle,
  imageUrl,
  availability,
  price,
  roomType,
  capacity,
  user
}) => {
  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [checkInDate, setCheckInDate] = useState(null);
  const [checkOutDate, setCheckOutDate] = useState(null);
  const [roomTypeSelected, setRoomTypeSelected] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [roomData, setRoomData] = useState([]);
  const [numberOfGuests, setNumberOfGuests] = useState(1);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [selectedRoomCapacity, setSelectedRoomCapacity] = useState(0); // Added for room capacity
  const [totalAmount, setTotalAmount] = useState(0);
  const navigate = useNavigate();
  console.log(user)

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const response = await fetch("http://localhost:5214/api/Room");
        const data = await response.json();
        setRoomData(data);
        console.log(data);
      } catch (error) {
        console.error("Error fetching room data:", error);
      }
    };
    fetchRoom();
  }, []);

  // Handle modal open and close
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  // Determine background color based on availability
  const availabilityColor =
    availability === "Available" ? "bg-green-700" : "bg-red-700";

  const handleRoomTypeChange = (e) => {
    setRoomTypeSelected(e.target.value);
    setRoomNumber("");
    setSelectedImage(null); // Reset image when room type changes
    setSelectedRoomId(null); // Reset room ID when room type changes
    setSelectedRoomCapacity(0); // Reset room capacity
  };

  const handleRoomNumberChange = (event) => {
    const selectedRoomNumber = event.target.value;
    setRoomNumber(selectedRoomNumber);

    console.log(roomType, roomNumber)
    console.log(222222)
    console.log(roomData[roomType])

    // Find the room with the selected roomNumber to get its id and images
    const selectedRoom = roomData.find(
      (room) => room.roomNumber === selectedRoomNumber && room.roomType === roomType
    );

    if (selectedRoom) {
      setSelectedRoomId(selectedRoom.id); // Set the room ID
      setSelectedImage(selectedRoom.imagePaths?.[0] || null); // Load the first image if available
      setSelectedRoomCapacity(selectedRoom.capacity); // Set the room capacity
      setTotalAmount(selectedRoom.price);
    } else {
      setSelectedImage(null);
      setSelectedRoomId(null); // Clear room ID if no room is selected
      setSelectedRoomCapacity(0); // Reset room capacity if no room is selected
    }
  };

  const DB_HOST = process.env.REACT_APP_DB_HOST;

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem("user"));
    console.log(user)
    if (user) {
      setEmail(user.email);
      setFirstName(user.firstName);
      setLastName(user.lastName);
      setPhoneNumber(user.phoneNumber)
    }
  }, []);

  const createBooking = async (customerId) => {
    try {
      const bookingData = new FormData();
      bookingData.append("GuestNumber", numberOfGuests);
      bookingData.append("CheckInDate", checkInDate.toISOString());
      bookingData.append("CheckOutDate", checkOutDate.toISOString());
      bookingData.append("CustomerId", customerId);
      bookingData.append("RoomId", selectedRoomId);
      bookingData.append("TotalAmount", totalAmount);

      const allBooking = await axios.get(`${DB_HOST}api/Booking`);
      const relevantBookings = allBooking.data.filter(
        (booking) =>
          booking.status !== "Canceled" &&
          !booking.isCheckout &&
          booking.roomId === selectedRoomId
      );

      const isOverlap = relevantBookings.some((booking) => {
        const existingCheckIn = new Date(booking.checkInDate);
        const existingCheckOut = new Date(booking.checkOutDate);

        return (
          checkInDate.toDate() < existingCheckOut &&
          checkOutDate.toDate() > existingCheckIn
        );
      });

      if (isOverlap) {
        alert("The selected room is already reserved for the specified dates.");
        return;
      }
      const newBookingResponse = await axios.post(
        `${DB_HOST}api/Booking`,
        bookingData
      );

      if (newBookingResponse.status === 201) {
        handleClose();
        window.location.reload();
      } else {
        console.error(
          "Error creating booking (non-201 status):",
          newBookingResponse
        );
      }
    } catch (e) {
      console.error("Error creating booking:", e);
    }
  };

  const validateFields = () => {
    if (
      !firstName ||
      !lastName ||
      !phoneNumber ||
      !numberOfGuests ||
      !roomType ||
      !roomNumber ||
      !checkInDate ||
      !checkOutDate
    ) {
      alert("Please fill in all required fields.");
      return false;
    }

    if (numberOfGuests > selectedRoomCapacity) {
      alert("Out of capacity for the selected room. The room capacity is ");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert("Please enter a valid email address.");
      return false;
    }

    if (checkInDate && checkOutDate && checkInDate.isAfter(checkOutDate)) {
      alert("Check-in date must be before check-out date.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateFields()) {
      return; // Prevent submission if validation fails
    }
    try {
      const response = await axios.get(
        `${DB_HOST}api/customer/${email}`)
      const customerId = response.data.id;
      await createBooking(customerId);
    } catch (error) {
      console.error("Error creating booking:", error);
    }
  };

  return (
    <div className="grid grid-cols-12 gap-10">
      {/* Room Image and Status */}
      <div className="relative col-span-4 max-h-[220px] w-full">
        <img
          src={`http://localhost:5214/${imageUrl}`}
          alt="room"
          className="w-full h-full object-cover rounded"
        />
        <div
          className={`absolute top-2 right-2 text-[12px] text-white ${availabilityColor} max-h-[28px] max-w-[81px] p-[4px] rounded`}
        >
          {availability}
        </div>
      </div>

      {/* Room Info */}
      <div className="col-span-8">
        <div className="grid grid-cols-6 gap-4">
          {/* Left Section */}
          <div className="col-span-4">
            <h2 className="text-2xl font-bold text-[30px]">{roomTitle}</h2>

            <div className="flex mt-2 flex-col">
              <div className="room-type flex items-center">
                <KingBedIcon /> {roomType}
              </div>
              <div className="room-capacity flex items-center">
                <PersonIcon /> {capacity}
              </div>
            </div>
          </div>

          {/* Right Section */}
          <div className="col-span-2 text-right gap-5 flex flex-col justify-between">
            <div className="top mb-4">
              {/* Info Section */}
              <div className="info flex items-center justify-end mb-2">
                <span className="text-[rgba(0, 0, 0, 0.6)]">
                  Non-refundable
                </span>
                <InfoIcon className="ml-2" />
              </div>

              {/* Price Section */}
              <div className="price">
                <h3 className="text-3xl font-bold">{price} USD</h3>
                <p className="text-sm text-gray-500">per night</p>
              </div>
            </div>

            {/* Select Button */}
            <div className="flex justify-end">
              <button
                className="bg-blue-900 text-white max-w-[120px] py-2 px-4 rounded hover:bg-blue-800 transition duration-200"
                onClick={user ? handleOpen : () => navigate("/login")}
              >
                {console.log("user" , user)}
                Select
              </button>
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="parent-modal-title"
        aria-describedby="parent-modal-description"
        className="flex items-center justify-center"
      >
        <Box sx={{ width: 750, p: 5 }} bgcolor={"white"} border={"none"}>
          <Typography
            variant="h6"
            component="h2"
            textAlign="center"
            fontSize={30}
            fontWeight={800}
            marginBottom={2}
          >
            New Reservation
          </Typography>

          <div className="flex gap-2">
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  required
                  variant="outlined"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  required
                  variant="outlined"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  variant="outlined"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  required
                  variant="outlined"
                  value={phoneNumber}
                  disabled
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="Check In Date"
                    required
                    value={checkInDate}
                    onChange={(newValue) => setCheckInDate(newValue)}
                    renderInput={(params) => (
                      <TextField {...params} fullWidth />
                    )}
                    className="w-100"
                  />
                </LocalizationProvider>
              </Grid>

              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="Check Out Date"
                    required
                    value={checkOutDate}
                    onChange={(newValue) => setCheckOutDate(newValue)}
                    renderInput={(params) => (
                      <TextField {...params} fullWidth />
                    )}
                  />
                </LocalizationProvider>
              </Grid>

              {/* Room Type Selector */}
              <Grid item xs={12} sm={6}>
                <FormControl variant="outlined" fullWidth required>
                  <InputLabel id="room-number-label">Room Number</InputLabel>
                  <Select
                    labelId="room-number-label"
                    value={roomTypeSelected}
                    onChange={handleRoomTypeChange}
                    label="Room Number"
                  >
                    {roomData.map((room) => (
                      <MenuItem key={room.roomType} value={room.roomType}>
                        {room.roomName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Room Number Selector based on selected Room Type */}
              <Grid item xs={12} sm={6}>
                <FormControl variant="outlined" fullWidth required>
                  <InputLabel id="room-number-label">Room Number</InputLabel>
                  <Select
                    labelId="room-number-label"
                    value={roomNumber}
                    onChange={handleRoomNumberChange}
                    label="Room Number"
                    disabled={!roomTypeSelected} // Disable if no room type selected
                  >
                    {console.log(roomTypeSelected)} {console.log(roomData)}
                    {roomTypeSelected &&
                      roomData
                        .filter((room) => room.roomType == roomTypeSelected)
                        .map((room) => (
                          <MenuItem
                            key={room.roomNumber}
                            value={room.roomNumber}
                          >
                            {room.roomNumber}
                          </MenuItem>
                        ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* Image Display */}
            <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
              <div className="w-full h-full">
                {selectedImage ? (
                  <img
                    src={`http://localhost:5214/${selectedImage}`}
                    alt="Room Image"
                    style={{
                      width: "100%",
                      height: "auto",
                      maxWidth: "400px",
                      borderRadius: 8,
                    }}
                    className="object-cover"
                  />
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    Select a room number to view image
                  </Typography>
                )}
              </div>
            </Box>
          </div>

          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
            <TextField
              label="Number Of Guests"
              required
              variant="outlined"
              sx={{
                width: "500px",
              }}
              type="number"
              value={numberOfGuests}
              onChange={(e) => setNumberOfGuests(e.target.value)}
            />
            <Button variant="contained" onClick={handleSubmit}>
              Save
            </Button>
          </Box>
        </Box>
      </Modal>
    </div>
  );
};

export default RoomCard;
