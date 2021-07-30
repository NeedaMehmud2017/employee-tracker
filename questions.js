const inquirer = require('inquirer');
const chalk = require('chalk');
const validateQuery = require('./Query');

//==== connect to the DB ====//
const mysql = require('mysql');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root1234',
    database: 'employee_managementDB',
});

connection.connect(function (err) {
    if (err) throw err;
    console.log("Connected!");
    console.log(chalk.yellow.bold(`====================================================================================`));
    start();
});

//==== promtp user ====//
const start = () => {
    inquirer.prompt([
        {
            name: 'choices',
            type: 'list',
            message: 'Please select an option:',
            choices: [
                'View All Employees',
                'View All Roles',
                'View All Departments',
                'View All Employees By Department',
                'View Department Budgets',
                'Update Employee Role',
                'Update Employee Manager',
                'Add Employee',
                'Add Role',
                'Add Department',
                'Remove Employee',
                'Remove Role',
                'Remove Department',
                'Exit'
            ]
        }
    ])
        .then((answers) => {
            const { choices } = answers;

            if (choices === 'View All Employees') {
                viewAllEmployees();
            }

            if (choices === 'View All Departments') {
                viewAllDepartments();
            }

            if (choices === 'View All Employees By Department') {
                viewEmployeesByDepartment();
            }

            if (choices === 'Add Employee') {
                addEmployee();
            }

            if (choices === 'Remove Employee') {
                removeEmployee();
            }

            if (choices === 'Update Employee Role') {
                updateEmployeeRole();
            }

            if (choices === 'Update Employee Manager') {
                updateEmployeeManager();
            }

            if (choices === 'View All Roles') {
                viewAllRoles();
            }

            if (choices === 'Add Role') {
                addRole();
            }

            if (choices === 'Remove Role') {
                removeRole();
            }

            if (choices === 'Add Department') {
                addDepartment();
            }

            if (choices === 'View Department Budgets') {
                viewDepartmentBudget();
            }

            if (choices === 'Remove Department') {
                removeDepartment();
            }

            if (choices === 'Exit') {
                connection.end();
            }
        });
};

//==== View All Employees ====//
const viewAllEmployees = () => {
    let sql = `SELECT employee.id, 
                  employee.first_name, 
                  employee.last_name, 
                  role.title, 
                  department.department_name AS 'department', 
                  role.salary
                  FROM employee, role, department 
                  WHERE department.id = role.department_id 
                  AND role.id = employee.role_id
                  ORDER BY employee.id ASC`;
    connection.query(sql, (error, response) => {
        if (error) throw error;
        console.log(chalk.yellow.bold(`====================================================================================`));
        console.log(`                              ` + chalk.green.bold(`Current Employees:`));
        console.log(chalk.yellow.bold(`====================================================================================`));
        console.table(response);
        start();
    });
};

//==== View All Roles ====//
const viewAllRoles = () => {
    const sql = `SELECT role.id, role.title, department.department_name AS department
                  FROM role
                  INNER JOIN department ON role.department_id = department.id`;
    console.log(chalk.yellow.bold(`====================================================================================`));
    console.log(`                              ` + chalk.green.bold(`Current Employee Roles:`));
    console.log(chalk.yellow.bold(`====================================================================================`));
    connection.query(sql, (error, response) => {
        if (error) throw error;
        response.forEach((role) => { console.log(role.title); });
        start();
    });
};

//==== View All Departments ====//
const viewAllDepartments = () => {
    const sql = `SELECT department.id AS id, department.department_name AS department FROM department`;
    connection.query(sql, (error, response) => {
        if (error) throw error;
        console.log(chalk.yellow.bold(`====================================================================================`));
        console.log(`                              ` + chalk.green.bold(`All Departments:`));
        console.log(chalk.yellow.bold(`====================================================================================`));
        console.table(response);
        start();
    });
};

//==== View All Employee Departments ====//
const viewEmployeesByDepartment = () => {
    const sql = `SELECT employee.first_name, 
                  employee.last_name, 
                  department.department_name AS department
                  FROM employee 
                  LEFT JOIN role ON employee.role_id = role.id 
                  LEFT JOIN department ON role.department_id = department.id`;
    connection.query(sql, (error, response) => {
        if (error) throw error;

        console.table(response);
        start();
    });
};

//==== View All Budget Departments ====//
const viewDepartmentBudget = () => {
    console.log(chalk.yellow.bold(`====================================================================================`));
    console.log(`                              ` + chalk.green.bold(`Budget By Department:`));
    console.log(chalk.yellow.bold(`====================================================================================`));
    const sql = `SELECT department_id AS id, 
                  department.department_name AS department,
                  SUM(salary) AS budget
                  FROM  role  
                  INNER JOIN department ON role.department_id = department.id GROUP BY  role.department_id`;
    connection.query(sql, (error, response) => {
        if (error) throw error;
        console.table(response);
        start();
    });
};

//==== add new Employees ====//
const addEmployee = () => {
    inquirer.prompt([
        {
            type: 'input',
            name: 'fistName',
            message: "What is the employee's first name?",
            validateQuery: addFirstName => {
                if (addFirstName) {
                    return true;
                } else {
                    console.log('Please enter a first name');
                    return false;
                }
            }
        },
        {
            type: 'input',
            name: 'lastName',
            message: "What is the employee's last name?",
            validateQuery: addLastName => {
                if (addLastName) {
                    return true;
                } else {
                    console.log('Please enter a last name');
                    return false;
                }
            }
        }
    ])
        .then(answer => {
            const crit = [answer.fistName, answer.lastName]
            const roleSql = `SELECT role.id, role.title FROM role`;
            connection.query(roleSql, (error, data) => {
                if (error) throw error;
                const roles = data.map(({ id, title }) => ({ name: title, value: id }));
                inquirer.prompt([
                    {
                        type: 'list',
                        name: 'role',
                        message: "What is the employee's role?",
                        choices: roles
                    }
                ])
                    .then(roleChoice => {
                        const role = roleChoice.role;
                        crit.push(role);
                        const managerSql = `SELECT * FROM employee`;
                        connection.query(managerSql, (error, data) => {
                            if (error) throw error;
                            const managers = data.map(({ id, first_name, last_name }) => ({ name: first_name + " " + last_name, value: id }));
                            inquirer.prompt([
                                {
                                    type: 'list',
                                    name: 'manager',
                                    message: "Who is the employee's manager?",
                                    choices: managers
                                }
                            ])
                                .then(managerChoice => {
                                    const manager = managerChoice.manager;
                                    crit.push(manager);
                                    const sql = `INSERT INTO employee (first_name, last_name, role_id, manager_id)
                                  VALUES (?, ?, ?, ?)`;
                                    connection.query(sql, crit, (error) => {
                                        if (error) throw error;
                                        console.log(chalk.yellow.bold(`====================================================================================`));
                                        console.log(chalk.redBright(`New Employee has been added!`));
                                        console.log(chalk.yellow.bold(`====================================================================================`)); viewAllEmployees();
                                    });
                                });
                        });
                    });
            });
        });
};

//==== add new role ====//
const addRole = () => {
    const sql = 'SELECT * FROM department'
    connection.query(sql, (error, response) => {
        if (error) throw error;
        let deptNamesArray = [];
        response.forEach((department) => { deptNamesArray.push(department.department_name); });
        deptNamesArray.push('Create Department');
        inquirer
            .prompt([
                {
                    name: 'departmentName',
                    type: 'list',
                    message: 'Which department is this new role in?',
                    choices: deptNamesArray
                }
            ])
            .then((answer) => {
                if (answer.departmentName === 'Create Department') {
                    this.addDepartment();
                } else {
                    addRoleResume(answer);
                }
            });

        const addRoleResume = (departmentData) => {
            inquirer
                .prompt([
                    {
                        name: 'newRole',
                        type: 'input',
                        message: 'What is the name of your new role?',
                        validateQuery: validateQuery.validateString
                    },
                    {
                        name: 'salary',
                        type: 'input',
                        message: 'What is the salary of this new role?',
                        validateQuery: validateQuery.validateSalary
                    }
                ])
                .then((answer) => {
                    let createdRole = answer.newRole;
                    let departmentId;

                    response.forEach((department) => {
                        if (departmentData.departmentName === department.department_name) { departmentId = department.id; }
                    });

                    let sql = `INSERT INTO role (title, salary, department_id) VALUES (?, ?, ?)`;
                    let crit = [createdRole, answer.salary, departmentId];

                    connection.query(sql, crit, (error) => {
                        if (error) throw error;
                        console.log(chalk.yellow.bold(`====================================================================================`));
                        console.log(chalk.redBright(`Role successfully created!`));
                        console.log(chalk.yellow.bold(`====================================================================================`));
                        viewAllRoles();
                    });
                });
        };
    });
};

//==== add new department ====//
const addDepartment = () => {
    inquirer
        .prompt([
            {
                name: 'newDepartment',
                type: 'input',
                message: 'What is the name of your new Department?',
                validateQuery: validateQuery.validateString
            }
        ])
        .then((answer) => {
            let sql = `INSERT INTO department (department_name) VALUES (?)`;
            connection.query(sql, answer.newDepartment, (error, response) => {
                if (error) throw error;
                console.log(chalk.greenBright.bold(`====================================================================================`));
                console.log(chalk.redBright(`New deapartment has been added!`));
                console.log(chalk.greenBright.bold(`====================================================================================`));
                viewAllDepartments();
            });
        });
};

//==== update an employee role ====//
const updateEmployeeRole = () => {
    let sql = `SELECT employee.id, employee.first_name, employee.last_name, role.id AS "role_id"
    FROM employee, role, department WHERE department.id = role.department_id AND role.id = employee.role_id`;
    connection.query(sql, (error, response) => {
        if (error) throw error;
        let employeeNamesArray = [];
        response.forEach((employee) => { employeeNamesArray.push(`${employee.first_name} ${employee.last_name}`); });

        let sql = `SELECT role.id, role.title FROM role`;
        connection.query(sql, (error, response) => {
            if (error) throw error;
            let rolesArray = [];
            response.forEach((role) => { rolesArray.push(role.title); });

            inquirer
                .prompt([
                    {
                        name: 'chosenEmployee',
                        type: 'list',
                        message: 'Which employee has a new role?',
                        choices: employeeNamesArray
                    },
                    {
                        name: 'chosenRole',
                        type: 'list',
                        message: 'What is their new role?',
                        choices: rolesArray
                    }
                ])
                .then((answer) => {
                    let newTitleId, employeeId;

                    response.forEach((role) => {
                        if (answer.chosenRole === role.title) {
                            newTitleId = role.id;
                        }
                    });

                    response.forEach((employee) => {
                        if (
                            answer.chosenEmployee ===
                            `${employee.first_name} ${employee.last_name}`
                        ) {
                            employeeId = employee.id;
                        }
                    });

                    let sqls = `UPDATE employee SET employee.role_id = ? WHERE employee.id = ?`;
                    connection.query(
                        sqls,
                        [newTitleId, employeeId],
                        (error) => {
                            if (error) throw error;
                            console.log(chalk.yellow.bold(`====================================================================================`));
                            console.log(chalk.redBright(`Employee role update!`));
                            console.log(chalk.yellow.bold(`====================================================================================`)); start();
                        }
                    );
                });
        });
    });
};

//==== update employee manager ====//
const updateEmployeeManager = () => {
    let sql = `SELECT employee.id, employee.first_name, employee.last_name, employee.manager_id
                    FROM employee`;
    connection.query(sql, (error, response) => {
        let employeeNamesArray = [];
        response.forEach((employee) => { employeeNamesArray.push(`${employee.first_name} ${employee.last_name}`); });

        inquirer
            .prompt([
                {
                    name: 'chosenEmployee',
                    type: 'list',
                    message: 'Which employee has a new manager?',
                    choices: employeeNamesArray
                },
                {
                    name: 'newManager',
                    type: 'list',
                    message: 'Who is their manager?',
                    choices: employeeNamesArray
                }
            ])
            .then((answer) => {
                let employeeId, managerId;
                response.forEach((employee) => {
                    if (
                        answer.chosenEmployee === `${employee.first_name} ${employee.last_name}`
                    ) {
                        employeeId = employee.id;
                    }

                    if (
                        answer.newManager === `${employee.first_name} ${employee.last_name}`
                    ) {
                        managerId = employee.id;
                    }
                });

                if (validateQuery.isSame(answer.chosenEmployee, answer.newManager)) {
                    console.log(chalk.redBright(`Invalid Manager Selection`));
                    start();
                } else {
                    let sql = `UPDATE employee SET employee.manager_id = ? WHERE employee.id = ?`;

                    connection.query(
                        sql,
                        [managerId, employeeId],
                        (error) => {
                            if (error) throw error;
                            console.log(chalk.yellow.bold(`====================================================================================`));
                            console.log(chalk.redBright(`Updated employee manager!`));
                            console.log(chalk.yellow.bold(`====================================================================================`)); start();
                        }
                    );
                }
            });
    });
};

//==== delete employees ====//
const removeEmployee = () => {
    let sql = `SELECT employee.id, employee.first_name, employee.last_name FROM employee`;

    connection.query(sql, (error, response) => {
        if (error) throw error;
        let employeeNamesArray = [];
        response.forEach((employee) => { employeeNamesArray.push(`${employee.first_name} ${employee.last_name}`); });

        inquirer
            .prompt([
                {
                    name: 'chosenEmployee',
                    type: 'list',
                    message: 'Which employee would you like to remove?',
                    choices: employeeNamesArray
                }
            ])
            .then((answer) => {
                let employeeId;

                response.forEach((employee) => {
                    if (
                        answer.chosenEmployee ===
                        `${employee.first_name} ${employee.last_name}`
                    ) {
                        employeeId = employee.id;
                    }

                });

                let sql = `DELETE FROM employee WHERE employee.id = ?`;
                connection.query(sql, [employeeId], (error) => {
                    if (error) throw error;
                    console.log(chalk.yellow.bold(`====================================================================================`));
                    console.log(chalk.redBright(`Employee successfully removed!`));
                    console.log(chalk.yellow.bold(`====================================================================================`));
                    viewAllEmployees();
                });
            });
    });
};

//==== delete a role ====//
const removeRole = () => {
    let sql = `SELECT role.id, role.title FROM role`;

    connection.query(sql, (error, response) => {
        if (error) throw error;
        let roleNamesArray = [];
        response.forEach((role) => { roleNamesArray.push(role.title); });

        inquirer
            .prompt([
                {
                    name: 'chosenRole',
                    type: 'list',
                    message: 'Which role would you like to remove?',
                    choices: roleNamesArray
                }
            ])
            .then((answer) => {
                let roleId;

                response.forEach((role) => {
                    if (answer.chosenRole === role.title) {
                        roleId = role.id;
                    }
                    else {
                        console.log("check your syntax");
                    }

                });

                let sql = `DELETE FROM role WHERE role.id = ?`;
                connection.query(sql, [roleId], (error) => {
                    if (error) throw error;
                    console.log(chalk.yellow.bold(`====================================================================================`));
                    console.log(chalk.redBright(`Role successfully removed!`));
                    console.log(chalk.yellow.bold(`====================================================================================`));
                    viewAllRoles();
                });
            });
    });
};

//==== delete a department ====//
const removeDepartment = () => {
    let sql = `SELECT department.id, department.department_name FROM department`;
    connection.query(sql, (error, response) => {
        if (error) throw error;
        let departmentNamesArray = [];
        response.forEach((department) => { departmentNamesArray.push(department.department_name); });

        inquirer
            .prompt([
                {
                    name: 'choseDepartment',
                    type: 'list',
                    message: 'Which department would you like to remove?',
                    choices: departmentNamesArray
                }
            ])
            .then((answer) => {
                let departmentId;

                response.forEach((department) => {
                    if (answer.choseDepartment === department.department_name) {
                        departmentId = department.id;
                    } else {
                        console.log("check your syntax");
                    }
                });

                console.log(departmentId);
                let sql = `DELETE FROM department WHERE department.id = ?`;
                connection.query(sql, [departmentId], (error) => {
                    if (error) throw error;
                    console.log(chalk.yellow.bold(`====================================================================================`));
                    console.log(chalk.redBright(`Department successfully removed!`));
                    console.log(chalk.yellow.bold(`====================================================================================`));
                    viewAllDepartments();
                });
            });
    });
};

