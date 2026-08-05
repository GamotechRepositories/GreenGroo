export function respondWithControllerError(res, error, context = "Request") {
  console.error(`${context} error:`, error);

  if (error.name === "ValidationError") {
    const message = Object.values(error.errors)
      .map((err) => err.message)
      .join(", ");
    return res.status(400).json({ success: false, message });
  }

  if (error.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid reference ID",
    });
  }

  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern || {})[0];
    if (field === "user") {
      return res.status(409).json({
        success: false,
        message: "Cart conflict — please refresh and try again",
      });
    }
    return res.status(400).json({
      success: false,
      message: "Duplicate entry — please refresh and try again",
    });
  }

  return res.status(500).json({
    success: false,
    message: error.message || `${context} failed`,
  });
}
