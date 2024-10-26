# TableReservation
Project for "Zarządzanie Projektami" class - table reservation system in a restaurant

## Running instructions:
### Bakend
To create virtual enviroment:
-  cd .\backend\
- python -m venv venv

To run App:
-  cd .\backend\
-  venv\Scripts\activate
-  pip install -r .\requirements.txt
-  flask run

### Front
To run first time:
1. download node.js:
https://nodejs.org/en/download/prebuilt-installer
2. Run this commands in cmd:
- cd .\frontend\
- npm install -g @angular/cli
- npm install 

Do the following to run frontend:
-  run second terminal
-  cd .\frontend\
-  ng serve 

## Other

### Mock
- To use a mock, you need to replace backApiUrl with mockApiUrl in frontend services and run json-server --watch mocks/db.json --routes mocks/routes.json --middlewares mocks/login.js in the second console 

### Openapi-generator
- To install openapi to Angular: npm install @openapitools/openapi-generator-cli -g 
- To generate example api to ts:  npx openapi-generator-cli generate -i ./apispecification/auth.yaml -g typescript-angular -o frontend/src/app/core/modules/auth 
