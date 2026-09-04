const fs = require('fs');

let openapiCode = fs.readFileSync('src/openapi.ts', 'utf-8');

// The extra brace causes problems. 
// We can just format it using a simple parenthesis/brace stack or replace the specific broken part.

openapiCode = openapiCode.replace(
  `            }
          }
        }
        }
      },
      post: {
        summary: "Initialize an Inventory Stock",`,
  `            }
          }
        }
      },
      post: {
        summary: "Initialize an Inventory Stock",`
);

fs.writeFileSync('src/openapi.ts', openapiCode);
console.log("Fixed openapi.ts");
