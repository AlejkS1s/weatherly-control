// FontAwesome configuration
import { library } from '@fortawesome/fontawesome-svg-core';
import { config } from '@fortawesome/fontawesome-svg-core';
import { 
  faTemperatureThreeQuarters,
  faDroplet,
  faGauge,
  faWind,
  faPowerOff,
  faGear,
  faArrowsRotate,
  faChartLine,
  faDatabase,
  faHome,
  faCog,
  faUser,
  faBell,
  faSearch,
  faPlus,
  faMinus,
  faEdit,
  faTrash,
  faSave,
  faCancel
} from '@fortawesome/free-solid-svg-icons';

// Tell Font Awesome to skip adding the CSS automatically 
// since it's being imported above
config.autoAddCss = false;

// Add all icons to the library so you can use them throughout your app
library.add(
  faTemperatureThreeQuarters,
  faDroplet,
  faGauge,
  faWind,
  faPowerOff,
  faGear,
  faArrowsRotate,
  faChartLine,
  faDatabase,
  faHome,
  faCog,
  faUser,
  faBell,
  faSearch,
  faPlus,
  faMinus,
  faEdit,
  faTrash,
  faSave,
  faCancel
);