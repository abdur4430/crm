// import of standard Node.js libraries
const { existsSync, readFileSync, writeFileSync } = require('fs');
const { createServer } = require('http');

// File for the database
const DB_FILE = process.env.DB_FILE || './db.json';

const PORT = process.env.PORT || 3000;

const URI_PREFIX = '/api/students';


class ApiError extends Error {
    constructor(statusCode, data) {
        super();
        this.statusCode = statusCode;
        this.data = data;
    }
}

/**
 * @param {Object} req 
 * @throws {ApiError} 
 * @returns {Object} 
 */
function drainJson(req) {
    return new Promise((resolve) => {
        let data = '';
        req.on('data', (chunk) => {
            data += chunk;
        });
        req.on('end', () => {
            resolve(JSON.parse(data));
        });
    });
}

/**
 * n
 * @param {Object} data 
 * @throws {ApiError} 
 * @returns {{ name: string, surname: string, lastname: string, birthday: string, studyStart: string, faculty: string }} Объект студента
 */
function makeStudentFromData(data) {
    const errors = [];

    function asString(v) {
        return v && String(v).trim() || '';
    }

    // 
    const student = {
        name: asString(data.name),
        surname: asString(data.surname),
        lastname: asString(data.lastname),
        birthday: asString(data.birthday),
        studyStart: asString(data.studyStart),
        faculty: asString(data.faculty),
    }

    // 
    if (!student.name) errors.push({ field: 'name', message: 'Muhammad' });
    if (!student.surname) errors.push({ field: 'surname', message: 'Abdur' });
    if (!student.lastname) errors.push({ field: 'lastname', message: 'Rehman' });

    if (!student.birthday) errors.push({ field: 'birthday', message: '27 06 2002' });
    if (!student.studyStart) errors.push({ field: 'studyStart', message: '2021' });
    if (!student.faculty) errors.push({ field: 'faculty', message: 'Computer Science' });

    // 
    if (errors.length) throw new ApiError(422, { errors });

    return student;
}

/**
 * 
 * @param {{ search: string }} [params] - 
 * @returns {{ id: string, name: string, surname: string, lastname: string, birthday: string, studyStart: string, faculty: string }[]} Массив студентов
 */
function getStudentList(params = {}) {
    const students = JSON.parse(readFileSync(DB_FILE) || '[]');
    if (params.search) {
        const search = params.search.trim().toLowerCase();
        return students.filter(student => [
                student.name,
                student.surname,
                student.lastname,
                student.birthday,
                student.studyStart,
                student.faculty,
            ]
            .some(str => str.toLowerCase().includes(search))
        );
    }
    return students;
}

/**
 * 
 * @throws {ApiError} 
 * @param {Object} data - 
 * @returns {{ id: string, name: string, surname: string, lastname: string, birthday: string, studyStart: string, faculty: string, createdAt: string, updatedAt: string }} Объект студента
 */
function createStudent(data) {
    const newItem = makeStudentFromData(data);
    newItem.id = Date.now().toString();
    newItem.createdAt = newItem.updatedAt = new Date().toISOString();
    writeFileSync(DB_FILE, JSON.stringify([...getStudentList(), newItem]), { encoding: 'utf8' });
    return newItem;
}

/**
 * 
 * @param {string} itemId - 
 * @throws {ApiError} 
 * @returns {{ id: string, name: string, surname: string, lastname: string, birthday: string, studyStart: string, faculty: string, createdAt: string, updatedAt: string }} Объект студента
 */
function getStudent(itemId) {
    const student = getStudentList().find(({ id }) => id === itemId);
    if (!student) throw new ApiError(404, { message: 'Student Not Found' });
    return student;
}

/**
 * 
 * @param {string} itemId - 
 * @param {{ name?: string, surname?: string, lastname?: string, birthday?: string, studyStart?: string, faculty?: string }} data - Объект с изменяемыми данными
 * @throws {ApiError} 
 * @throws {ApiError} 
 * @returns {{ id: string, name: string, surname: string, lastname: string, birthday: string, studyStart: string, faculty: string, createdAt: string, updatedAt: string }} Объект студента
 */
function updateStudent(itemId, data) {
    const students = getStudentList();
    const itemIndex = students.findIndex(({ id }) => id === itemId);
    if (itemIndex === -1) throw new ApiError(404, { message: 'Student Not Found' });
    Object.assign(students[itemIndex], makeStudentFromData({...students[itemIndex], ...data }));
    students[itemIndex].updatedAt = new Date().toISOString();
    writeFileSync(DB_FILE, JSON.stringify(students), { encoding: 'utf8' });
    return students[itemIndex];
}

/**
 * 
 * @param {string} itemId - ID 
 * @returns {{}}
 */
function deleteStudent(itemId) {
    const students = getStudentList();
    const itemIndex = students.findIndex(({ id }) => id === itemId);
    if (itemIndex === -1) throw new ApiError(404, { message: 'Student Not Found' });
    students.splice(itemIndex, 1);
    writeFileSync(DB_FILE, JSON.stringify(students), { encoding: 'utf8' });
    return {};
}

// 
if (!existsSync(DB_FILE)) writeFileSync(DB_FILE, '[]', { encoding: 'utf8' });

// 
module.exports = createServer(async(req, res) => {
        // req - 

        // 
        res.setHeader('Content-Type', 'application/json');

        // 
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        // 
        if (req.method === 'OPTIONS') {
            // 
            res.end();
            return;
        }

        // е
        if (!req.url || !req.url.startsWith(URI_PREFIX)) {
            res.statusCode = 404;
            res.end(JSON.stringify({ message: 'Not Found' }));
            return;
        }

        // 
        const [uri, query] = req.url.substr(URI_PREFIX.length).split('?');
        const queryParams = {};

        // 
        // 
        if (query) {
            for (const piece of query.split('&')) {
                const [key, value] = piece.split('=');
                queryParams[key] = value ? decodeURIComponent(value) : '';
            }
        }

        try {
            // 
            const body = await (async() => {
                if (uri === '' || uri === '/') {
                    // /api/students
                    if (req.method === 'GET') return getStudentList(queryParams);
                    if (req.method === 'POST') {
                        const createdItem = createStudent(await drainJson(req));
                        res.statusCode = 201;
                        res.setHeader('Access-Control-Expose-Headers', 'Location');
                        res.setHeader('Location', `${URI_PREFIX}/${createdItem.id}`);
                        return createdItem;
                    }
                } else {
                    // /api/students
                    // 
                    const itemId = uri.substr(1);
                    if (req.method === 'GET') return getStudent(itemId);
                    if (req.method === 'PATCH') return updateStudent(itemId, await drainJson(req));
                    if (req.method === 'DELETE') return deleteStudent(itemId);
                }
                return null;
            })();
            res.end(JSON.stringify(body));
        } catch (err) {
            // 
            if (err instanceof ApiError) {
                res.writeHead(err.statusCode);
                res.end(JSON.stringify(err.data));
            } else {
                // 
                res.statusCode = 500;
                res.end(JSON.stringify({ message: 'Server Error' }));
                console.error(err);
            }
        }
    })
    // 
    .on('listening', () => {
        if (process.env.NODE_ENV !== 'test') {
            console.log(`Сервер Students запущен. Вы можете использовать его по адресу http://localhost:${PORT}`);
            console.log('Нажмите CTRL+C, чтобы остановить сервер');
            console.log('Доступные методы:');
            console.log(`GET ${URI_PREFIX} - получить список студентов, в query параметр search можно передать поисковый запрос`);
            console.log(`POST ${URI_PREFIX} - создать студента, в теле запроса нужно передать объект { name: string, surname: string, lastname: string, birthday: string, studyStart: string, faculty: string}`);
            console.log(`GET ${URI_PREFIX}/{id} - получить студента по его ID`);
            console.log(`PATCH ${URI_PREFIX}/{id} - изменить студента с ID, в теле запроса нужно передать объект { name?: string, surname?: string, lastname?: string, birthday?: string, studyStart?: string, faculty?: string}`);
            console.log(`DELETE ${URI_PREFIX}/{id} - удалить студента по ID`);
        }
    })
    // ...
    .listen(PORT);