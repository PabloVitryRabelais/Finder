import { useParams } from "react-router-dom";

export default function Reservation() {
    const { id } = useParams();
    return <h1>Reservation {id}</h1>;
}