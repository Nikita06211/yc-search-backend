import { Request, Response } from "express";
import { syncYCData } from "../services/ycSync.service";

export async function syncData(req: Request, res: Response) {
    const result = await syncYCData();
    res.json(result);
}
