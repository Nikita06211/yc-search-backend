import axios from "axios";

export async function fetchAllYCCompanies() {
    const url = "https://yc-oss.github.io/api/companies/all.json";
    const res = await axios.get(url);
    return res.data;
}
