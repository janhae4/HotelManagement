import React, { useEffect, useState } from "react";
import Breadcrumb from "../layout/Breadcrumb";
import Amenities from "./Amenity";
import KingBedIcon from "@mui/icons-material/KingBed";
import RoomCardLists from "./RoomCardLists";
import axios from "axios";
import { useNavigate } from "react-router-dom";
const RoomsContent = ({user}) => {
  const dbHost = "http://localhost:5214/";
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await axios.get(`${dbHost}api/Room`);
        setRooms(response.data);
      } catch (err) {
        console.error("Error fetching rooms:", err);
      }
    };

    fetchRooms();
  }, []);

  const rooms_empty = [];

  return (
    <div className="px-[122px] flex flex-col font-inter my-[63px] gap-[30px] text-[20px]">
      <Breadcrumb
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Rooms", href: "/rooms" },
        ]}
      />

      {/* Room Filter */}
      <div className="roomFiltering flex flex-col gap-[20px]">
        <div className="text-bold text-[30px]">Select your room</div>
        <div className="flex flex-wrap gap-[10px]">
          <Amenities name="Room type" />
          <Amenities name="" icon={<KingBedIcon />} />
          <Amenities name="Amenities" />
        </div>

        <div className="searchResult_amount">
          {rooms.length != 0
            ? rooms.length + " rooms has been found"
            : "Not found"}{" "}
        </div>
      </div>

      <div className="searchResult_items flex flex-col gap-7">
        <RoomCardLists rooms={rooms} user={user} />
      </div>
    </div>
  );
};

export default RoomsContent;
