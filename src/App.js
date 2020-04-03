import React from 'react';
import './App.css';
import { makeStyles } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import Drawer from '@material-ui/core/Drawer';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import ViewListIcon from '@material-ui/icons/ViewList';
import PublishIcon from '@material-ui/icons/Publish';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import Container from '@material-ui/core/Container';
import MenuIcon from '@material-ui/icons/Menu';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import { Link } from 'react-router-dom';
import Main from './main';

const drawerWidth = 240;

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
  },
  toolbar: {
    paddingRight: 24, // keep right padding when drawer closed
  },
  toolbarIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: '0 8px',
    ...theme.mixins.toolbar,
  },
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },
  menuButton: {
    marginRight: 36,
  },
  title: {
    flexGrow: 1,
  },
  drawerPaper: {
    position: 'relative',
    whiteSpace: 'nowrap',
    width: drawerWidth,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  drawerPaperClose: {
    overflowX: 'hidden',
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    width: theme.spacing(7),
    [theme.breakpoints.up('sm')]: {
      width: theme.spacing(9),
    },
  },
  appBarSpacer: theme.mixins.toolbar,
  content: {
    flexGrow: 1,
    height: '100vh',
    overflow: 'auto',
  },
  container: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
  },
}));

function App() {
  const classes = useStyles();
  const [open, setOpen] = React.useState(false);
  const handleDrawerOpen = () => {
    setOpen(true);
  };
  const handleDrawerClose = () => {
    setOpen(false);
  };
  const [apiVersion, setAPIVersion] = React.useState('v1');
  const enginUrl = '/engine/' + apiVersion;
  React.useEffect(() => {
    fetch(enginUrl + '/version')
      .then(res => res.json())
      .then(res => setAPIVersion('v' + res.cromwell))
      .catch(err => console.log(err));
  }, [enginUrl]);

  return (
    <div className={`App ${classes.root}`}>
      <CssBaseline />
      <AppBar position='absolute' className={classes.appBar}>
        <Toolbar className={classes.toolbar}>
          <IconButton
            edge='start'
            color='inherit'
            aria-label='open drawer'
            onClick={open ? handleDrawerClose : handleDrawerOpen}
            className={classes.menuButton}
          >
            {open ? <ChevronLeftIcon /> : <MenuIcon />}
          </IconButton>
          <Typography component='h1' variant='h6' color='inherit' noWrap className={classes.title}>
            Cromwell Dashboard
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer
        variant='permanent'
        classes={{
          paper: open ? classes.drawerPaper : classes.drawerPaperClose,
        }}
        open={open}
      >
        <List>
          <div className={classes.appBarSpacer} />
          <ListItem button
            component={Link} to={`/workflows/${apiVersion}/query`}
          >
            <ListItemIcon>
              <ViewListIcon />
            </ListItemIcon>
            <ListItemText
              primary='View workflows'
              primaryTypographyProps={{noWrap: true}}
            />
          </ListItem>
          <ListItem button component={Link} to={`/workflows/${apiVersion}`}>
            <ListItemIcon>
              <PublishIcon />
            </ListItemIcon>
            <ListItemText
              primary='Submit a workflow'
              primaryTypographyProps={{noWrap: true}}
            />
          </ListItem>
        </List>
      </Drawer>
      <main className={classes.content}>
        <div className={classes.appBarSpacer} />
        <Container maxWidth='lg' className={classes.container}>
          <Main apiVersion={apiVersion}/>
        </Container>
      </main>
    </div>
  );
}

export default App;
