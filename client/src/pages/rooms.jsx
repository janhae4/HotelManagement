import React, { useEffect } from 'react'
import Slide from '../components/rooms/Slide'
import RoomsContent from '../components/rooms/RoomsContent'
import { useNavigate } from 'react-router-dom'
const user = JSON.parse(sessionStorage.getItem('user'))
const Rooms = () => {
  return (
    <div className='flex flex-col'>
      <Slide />
      <RoomsContent user={user}/>
    </div>
  )
}

export default Rooms
