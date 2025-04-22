import React, { useEffect, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";

const MyStays = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState([]);
  const DB_HOST = process.env.REACT_APP_DB_HOST;

  useEffect(() => {
    const account = JSON.parse(sessionStorage.getItem("user"));
    console.log(account);
    if (account) {
      fetchBookings(account.email);
    }
  }, []);

  const fetchBookings = async (email) => {
    try {
      const res = await axios.get(`${DB_HOST}api/Booking/${email}`);
      const userBookings = res.data;
      console.log(userBookings);
      setBookings(userBookings);
      // Fetch rooms data for each booking
      const roomsData = await Promise.all(
        userBookings.map(async (element) => {
          return fetchRoom(element.roomId);
        })
      );
      setRooms(roomsData);
    } catch (err) {
      console.error("Error fetching bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoom = async (id) => {
    try {
      const res = await axios.get(`${DB_HOST}api/Room/${id}`);
      return res.data;
    } catch (err) {
      console.error("Error fetching room:", err);
      return null; // Return null if the room data couldn't be fetched
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">My Stays</h1>
      {bookings.length === 0 ? (
        <p>You have no bookings yet.</p>
      ) : (
        <div className="grid gap-4">
          {bookings.map((booking, index) => {
            const room = rooms[index]; // Get the room data corresponding to the booking
            return (
              <div key={index} className="border p-4 rounded shadow flex">
                <div className="flex-1 pr-4">
                  <p>
                    <strong>Room:</strong> {room?.roomName || "N/A"}
                  </p>
                  <p>
                    <strong>Price:</strong> ${room?.roomPrice}
                  </p>
                  <p>
                    <strong>Room Type:</strong> {room?.roomType || "N/A"}
                  </p>
                  <p>
                    <strong>Capacity:</strong> {room?.capacity || "N/A"}
                  </p>
                  <p>
                    <strong>Check-in:</strong>{" "}
                    {dayjs(booking.checkInDate).format("YYYY-MM-DD")}{" "}
                    <strong>-</strong>{" "}
                    {dayjs(booking.checkOutDate).format("YYYY-MM-DD")}
                  </p>
                  <p>
                    <strong>Status: {booking.status}</strong>
                  </p>
                </div>

                {/* Show image on the right */}
                {room?.imagePaths && room.imagePaths.length > 0 && (
                  <div className="flex-shrink-0">
                    <img
                      src={`http://localhost:5214/${room.imagePaths[0]}`} // Assuming the first image is the main image
                      alt={room.roomName}
                      className="w-32 h-32 object-cover rounded"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyStays;
