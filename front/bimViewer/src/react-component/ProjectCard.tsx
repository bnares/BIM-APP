import React from 'react'
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Collapse from '@mui/material/Collapse';
import Avatar from '@mui/material/Avatar';
import IconButton, { IconButtonProps } from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { red } from '@mui/material/colors';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ShareIcon from '@mui/icons-material/Share';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import { Button, Tooltip } from '@mui/material';
import { Link } from 'react-router-dom';
import { IProjectData } from './Home';

export interface ICardData{
    fileName: string,
}

function ProjectCard(props:IProjectData) {
    console.log("Project: ", props);
  return (
    <Card sx={{ maxWidth: '340px' }}>
    <CardHeader
      avatar={
        <Avatar sx={{ bgcolor: red[500] }} aria-label="recipe">
          {Array.from(props.name)[0].toUpperCase()}
        </Avatar>
      }
      action={
        <IconButton aria-label="settings">
          <MoreVertIcon />
        </IconButton>
      }
      title={props.name.replace(".ifc","").toUpperCase()}
      subheader={["Active", "Pending", "Finished"][(Math.floor(Math.random()*3))]}
    />
    <CardMedia
      component="img"
      height="50%"
      image= {`./public/${props.photo}`}
      alt="Project BIM Photo"
    />
    <CardContent>
      <Typography variant="body2" color="text.secondary">
        Some Example Text : Lorem ipsum dolor sit amet, consectetur adipisicing elit. Minus ad ea repellat, sint neque consequuntur nisi recusandae mollitia, excepturi impedit sed corrupti distinctio eaque quidem quis, omnis earum tempora magni.
      </Typography>
    </CardContent>
    <CardActions sx={{display:'flex', justifyContent:'center', alignItems:'center'}}>
      <Button component={Link} to={`${props.name.replace(".ifc","")}`}  variant="contained" color='warning' startIcon={<ViewInArIcon fontSize='large'  sx={{fontSize:'2rem'}}/>} sx={{width:'60%'}}>View</Button>
    </CardActions>
  </Card>
  )
}

export default ProjectCard