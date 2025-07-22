import useSWR from "swr"

const fetcher = url => fetch(url).then(res => res.json())
// const baseUrl = "http://localhost:3000/api"
const baseUrl = "/api"

export const useGetEleves = () => {

  const url = baseUrl + "/members"

  const { data: members, error } = useSWR(url, fetcher)

  return { eleves:members?.eleves, profs: members?.profs, school: members?.school, error }
}


