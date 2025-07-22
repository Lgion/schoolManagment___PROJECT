import Link from 'next/link'
import DateFormatter from './date-formatter'

type Props = {
  name: string
  picture: string
  date: string
}

const Avatar = ({ name, picture, date }: Props) => {
  return (
    // <Link href="#" className="author">
    <div className="author">

      <img src={picture} className="" alt={name} />
      Édité par&nbsp;
      <span className="">{name}</span>
      <p>Le&nbsp;<DateFormatter dateString={date} />&nbsp;</p>
      
    </div>
    // </Link>
  )
}

export default Avatar
