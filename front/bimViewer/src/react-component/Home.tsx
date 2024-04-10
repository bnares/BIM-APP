import React from 'react'
import ProjectCard from './ProjectCard';
//import {Chart}  from "chart.js/auto";


export interface IProjectData{
    name:string,
    photo: string
}

const fileData : {name:string, photo:string}[] = [{name:"maly.ifc", photo:'magazyn.png'},{name:'sredni.ifc',photo:'blok.png'}];


function Home() {

  const [fileNames, setFileNames] = React.useState<IProjectData[]>(fileData);
    
  const printCard = fileNames.map(file=>{
        return(
            <ProjectCard name={file.name} photo={file.photo}  key={file.name}/>
        )
    })
    
  

  return (
    <div style={{display: "flex",flexDirection:'row', justifyContent:'center', alignItems:'center', gap:'2rem'}}>
       
        {fileNames.length > 0 ? <div style={{display:"flex", width:'100vw', justifyContent:'space-around', alignItems:'center'}}> {printCard} </div> : <p>No Project to Display</p>}
    </div>
    
  )
}

export default Home