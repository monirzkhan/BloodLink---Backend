import axios from "axios";
import { AppError } from "./AppError";
import httpStatus from "http-status";

export const getCoordinates = async (address: string) => {
  const response = await axios.get(
    "https://nominatim.openstreetmap.org/search",
    {
      params: {
        q: address,
        format: "json",
        limit: 1,
      },
      headers: {
        "User-Agent": "BloodLink/1.0",
      },
    }
  );

  if (!response.data.length) {
    throw new AppError(httpStatus.NOT_FOUND, "Address not found");
  }

  return {
    latitude: Number(response.data[0].lat),
    longitude: Number(response.data[0].lon),
  };
};