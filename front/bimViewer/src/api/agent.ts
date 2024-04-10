import axios, { AxiosResponse } from "axios"

axios.defaults.baseURL = "https://localhost:7090/api/";

const responseBody = (response : AxiosResponse)=> response.data;

const request = {
    get: (url: string)=>axios.get(url).then(responseBody),
    post: (url: string, body:{})=>axios.post(url, body).then(responseBody),
    delete: (url: string)=>axios.delete(url).then(responseBody),
}

const toDo = {
    allToDos: (fileName: string)=>request.get(`ToDo/allToDos/${fileName}`),
    getToDo:(fileName: string)=>request.get(`ToDo/getToDo/${fileName}`),
    deleteToDo:(id: number)=> request.delete(`ToDo/removeToDo/${id}`),
    addToDo:(body:{})=> request.post("ToDo/newToDo", body),
}

const agent = {
    toDo,
}

export default agent;