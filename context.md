# LLM Flow
1. User prompt (via front end) => handled by Next JS
2. FE Send API to go (curl)
3. GO send API request to GPT 
4. GPT return API to go
5. Go forward to FE
6. FE Show

Must be handled less than 1 second

Also we implement FE protect first. IF there is no context match of the prompt then agent on FE level return response:

*"Maaf, pertanyaan Anda berada di luar cakupan HR yang dapat saya bantu. Bisakah Anda mengajukan pertanyaan terkait kepegawaian, departemen, posisi, atau proyek?"*



# GO API
## Requirement

- HIT API GO 

# API Documentation

## Base URL
```
http://localhost:8000
```

## Endpoints

### LLM/Agent Endpoints
- `POST /api/llm` - Send prompt to LLM agent with database context
- `POST /api/prompt` - Handle prompt processing

### Migration/Seeding Endpoints
- `POST /api/migrate/all` - Seed all tables (clients, departments, positions, employees)
- `POST /api/migrate/employees` - Seed employees table only

### Employee Management (CRUD)
- `GET /api/employees` - Get all employees
- `GET /api/employees?id={id}` - Get employee by ID
- `POST /api/employees` - Create new employee
- `PUT /api/employees` - Update employee
- `DELETE /api/employees` - Delete employee

### Department Management (CRUD)
- `GET /api/departments` - Get all departments
- `GET /api/departments?id={id}` - Get department by ID
- `POST /api/departments` - Create new department
- `PUT /api/departments` - Update department
- `DELETE /api/departments` - Delete department

### Position Management (CRUD)
- `GET /api/positions` - Get all positions
- `GET /api/positions?id={id}` - Get position by ID
- `POST /api/positions` - Create new position
- `PUT /api/positions` - Update position
- `DELETE /api/positions` - Delete position

### Client Management (CRUD)
- `GET /api/clients` - Get all clients
- `GET /api/clients?id={id}` - Get client by ID
- `POST /api/clients` - Create new client
- `PUT /api/clients` - Update client
- `DELETE /api/clients` - Delete client

### Project Management (CRUD)
- `GET /api/projects` - Get all projects
- `GET /api/projects?id={id}` - Get project by ID
- `POST /api/projects` - Create new project
- `PUT /api/projects` - Update project
- `DELETE /api/projects` - Delete project

### Employee-Project Assignment (CRUD)
- `GET /api/employee_projects` - Get all employee-project assignments
- `GET /api/employee_projects?employee_id={id}&project_id={id}` - Get specific assignment
- `POST /api/employee_projects` - Assign employee to project
- `PUT /api/employee_projects` - Update assignment
- `DELETE /api/employee_projects` - Remove assignment
