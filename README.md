# TableReservation
Project for "Zarządzanie Projektami" class - table reservation system in a restaurant

## Running instructions:
### Bakend
-  cd .\backend\
-  venv\Scripts\activate
-  pip install -r .\requirements.txt
-  flask run
### Front
-  run second terminal
-  cd .\frontend\
-  ng serve 

## Other

### Mock
- To use a mock, you need to replace backApiUrl with mockApiUrl in frontend services and run json-server --watch mocks/db.json --routes mocks/routes.json --middlewares mocks/login.js in the second console 

### Openapi-generator
- To install openapi to Angular: npm install @openapitools/openapi-generator-cli -g 
- To generate example api to ts:  npx openapi-generator-cli generate -i ./apispecification/auth.yaml -g typescript-angular -o frontend/src/app/core/modules/auth 
