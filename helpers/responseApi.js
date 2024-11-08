/**
 * @desc    This file contains Success and Error responses for sending to client/user
 * @author  Huda Prasetyo
 * @since   2020
 */

/**
 * @desc    Send any success response
 *
 * @param   {string} message
 * @param   {object | array} data
 * @param   {number} statusCode
 * @returns {object}
 */
export const success = (message, data, statusCode) => ({
  message,
  errors: false,
  code: statusCode,
  data,
});

/**
 * @desc    Send any error response
 *
 * @param   {string} message
 * @param   {number} statusCode
 * @returns {object}
 */
export const errors = (message, statusCode) => {
  const codes = [200, 201, 400, 401, 404, 403, 422, 500];
  const findCode = codes.find((code) => code == statusCode);

  statusCode = findCode ? findCode : 500;

  return {
    message,
    code: statusCode,
    error: true,
  };
};

/**
 * @desc    Send any validation response
 *
 * @param   {object | array} errors
 * @param   {array} data
 * @returns {object}
 */
export const validation = (errors, data = []) => ({
  message: errors,
  error: "Validation errors",
  code: 422,
  data,
});
