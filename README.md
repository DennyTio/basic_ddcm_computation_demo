# Basic DDCM Computation Demo

## Disclaimer
This public repository does not include advanced features such as database connections, caching, or entity relationships, unlike the [DDCM Demo](https://dennytio90.my.id/ddcm-demo). These functionalities are excluded to maintain the authenticity of the original project.

## Note
The repository focuses on the following areas:
- Mathematical calculations using the [math.js](https://mathjs.org/) library.
- Handling `if/else` logic from string-based expressions, which is beyond the scope of the [math.js](https://mathjs.org/) library.
- String value handling, which is not supported by the [math.js](https://mathjs.org/) library.

## How to Test the API

1. There is only one available API endpoint: `/logic-demo/compute/exec-expression`.

2. The API requires the following parameters:
   ```json
   {
     "code": [string],
     "expectedReturnType": [string: "number" / "string"]
   }
3. Example for testing the API using curl in git bash: 
   ```
   curl -X GET http://localhost:3001/logic-demo/compute/exec-expression -H "Content-Type: application/json" -d '{"code":"x=12;\n (x + 12 + (1 + 1 * (2 + 1)))", "expectedReturnType":"number"}'
   ```
4. You can use other methods to call the API such as Postman, Browsers, etc.

## Developed using following libraries:
- NestJS
- Math.js
- Zod
- UUID