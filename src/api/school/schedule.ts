import { Router, Response, Request } from "express";
import Neis from "@my-school.info/neis-api";
import {logger} from "../../log/logger";

const neis = new Neis({
  KEY: process.env.NEIS_KEY,
  Type: "json",
});

//학사정보
async function getSchedule(req: Request, res: Response) {
  try {
    const school = await neis.getSchoolInfo({
      SCHUL_NM: "상명고등학교",
    });

    const schedule = await neis.getSchedule({
      ATPT_OFCDC_SC_CODE: school[0].ATPT_OFCDC_SC_CODE,
      SD_SCHUL_CODE: school[0].SD_SCHUL_CODE,
      AA_YMD: req.query.AA_YMD as string,
    });

    res.send({ schedule, success: true });
  } catch (error) {
    logger.error("[schedule]" + error);
    res.status(500).send({ error: error.message, success: false });
  }
}

export { getSchedule };
