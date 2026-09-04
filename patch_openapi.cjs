const fs = require('fs');

let openapiCode = fs.readFileSync('src/openapi.ts', 'utf-8');

// I will insert query parameters into the paths.
// Let's create a simpler way to do this using regex.

const queryParams = `
          parameters: [
            { name: "page", in: "query", schema: { type: "integer", default: 1 }, description: "Page number for pagination" },
            { name: "limit", in: "query", schema: { type: "integer", default: 10 }, description: "Number of items per page" },
            { name: "sortBy", in: "query", schema: { type: "string" }, description: "Field to sort by" },
            { name: "sortOrder", in: "query", schema: { type: "string", enum: ["asc", "desc"] }, description: "Sort direction" },
            { name: "search", in: "query", schema: { type: "string" }, description: "Search term" }
          ],`;

// Add to inventory GET
openapiCode = openapiCode.replace(
  'description: "Retrieve a list of all inventory items.",\n        responses:',
  'description: "Retrieve a list of all inventory items.",' + queryParams + '\n        responses:'
);

// Add to suppliers GET
openapiCode = openapiCode.replace(
  'description: "Retrieve a list of all suppliers.",\n        responses:',
  'description: "Retrieve a list of all suppliers.",' + queryParams + '\n        responses:'
);

// Update inventory response schema to Paginated format
openapiCode = openapiCode.replace(
  /responses: {\s+"200": {\s+description: "A list of inventory items.",\s+content: {\s+"application\/json": {\s+schema: {\s+type: "array",\s+items: { \$ref: "#\/components\/schemas\/InventoryItem" }\s+}\s+}\s+}\s+}/,
  `responses: {
          "200": {
            description: "A list of inventory items.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    total: { type: "integer" },
                    page: { type: "integer" },
                    limit: { type: "integer" },
                    totalPages: { type: "integer" },
                    data: { type: "array", items: { $ref: "#/components/schemas/InventoryItem" } }
                  }
                }
              }
            }
          }
        }`
);

// Update suppliers response schema to Paginated format
openapiCode = openapiCode.replace(
  /responses: {\s+"200": {\s+description: "A list of suppliers.",\s+content: {\s+"application\/json": {\s+schema: {\s+type: "array",\s+items: { \$ref: "#\/components\/schemas\/Supplier" }\s+}\s+}\s+}\s+}/,
  `responses: {
          "200": {
            description: "A list of suppliers.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    total: { type: "integer" },
                    page: { type: "integer" },
                    limit: { type: "integer" },
                    totalPages: { type: "integer" },
                    data: { type: "array", items: { $ref: "#/components/schemas/Supplier" } }
                  }
                }
              }
            }
          }
        }`
);

fs.writeFileSync('src/openapi.ts', openapiCode);
console.log("Patched src/openapi.ts");
