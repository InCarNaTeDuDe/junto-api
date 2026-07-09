// Instead of every controller doing

// try{
// }
// catch(e){
//    res.status(...)
// }

import { Request, Response, NextFunction } from "express";

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  console.error(err);

  return res.status(err.status ?? 500).json({
    success: false,
    error: err.message ?? "Internal Server Error",
  });
}
