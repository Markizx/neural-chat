// Quick fix types to resolve compilation errors
declare module 'react' {
  const React: any;
  export = React;
  export as namespace React;
}

declare module 'react-dom/client' {
  export const createRoot: any;
}

declare module 'react-router-dom' {
  export const BrowserRouter: any;
  export const useNavigate: any;
  export const useParams: any;
  export const useLocation: any;
  export const Navigate: any;
  export const Routes: any;
  export const Route: any;
}

declare module '@mui/material' {
  export const Box: any;
  export const Paper: any;
  export const Typography: any;
  export const Button: any;
  export const IconButton: any;
  export const TextField: any;
  export const Chip: any;
  export const CircularProgress: any;
  export const LinearProgress: any;
  export const Alert: any;
  export const Divider: any;
  export const List: any;
  export const ListItem: any;
  export const ListItemText: any;
  export const ListItemIcon: any;
  export const ListItemButton: any;
  export const Avatar: any;
  export const Menu: any;
  export const MenuItem: any;
  export const Dialog: any;
  export const DialogTitle: any;
  export const DialogContent: any;
  export const DialogActions: any;
  export const Drawer: any;
  export const AppBar: any;
  export const Toolbar: any;
  export const Grid: any;
  export const Card: any;
  export const CardContent: any;
  export const CardActions: any;
  export const Switch: any;
  export const FormControl: any;
  export const FormControlLabel: any;
  export const Select: any;
  export const InputLabel: any;
  export const Checkbox: any;
  export const Radio: any;
  export const RadioGroup: any;
  export const Slider: any;
  export const Tabs: any;
  export const Tab: any;
  export const TabPanel: any;
  export const Accordion: any;
  export const AccordionSummary: any;
  export const AccordionDetails: any;
  export const Tooltip: any;
  export const Snackbar: any;
  export const Badge: any;
  export const Fab: any;
  export const SpeedDial: any;
  export const SpeedDialAction: any;
  export const Breadcrumbs: any;
  export const Link: any;
  export const Stepper: any;
  export const Step: any;
  export const StepLabel: any;
  export const StepContent: any;
  export const Table: any;
  export const TableBody: any;
  export const TableCell: any;
  export const TableContainer: any;
  export const TableHead: any;
  export const TableRow: any;
  export const Pagination: any;
}

declare module '@mui/material/styles' {
  export const ThemeProvider: any;
  export const createTheme: any;
  export const useTheme: any;
  export type PaletteMode = 'light' | 'dark';
}

declare module '@mui/material/CssBaseline' {
  const CssBaseline: any;
  export default CssBaseline;
}

declare module '@mui/icons-material' {
  export const Add: any;
  export const Delete: any;
  export const Edit: any;
  export const Save: any;
  export const Cancel: any;
  export const Search: any;
  export const Clear: any;
  export const Close: any;
  export const Menu: any;
  export const MoreVert: any;
  export const Settings: any;
  export const Home: any;
  export const Chat: any;
  export const Send: any;
  export const Attach: any;
  export const Download: any;
  export const Upload: any;
  export const Share: any;
  export const Copy: any;
  export const PlayArrow: any;
  export const Pause: any;
  export const Stop: any;
  export const Psychology: any;
  export const SmartToy: any;
  export const ThumbUp: any;
  export const ThumbDown: any;
  export const Star: any;
  export const StarBorder: any;
  export const Favorite: any;
  export const FavoriteBorder: any;
  export const Visibility: any;
  export const VisibilityOff: any;
  export const Lock: any;
  export const LockOpen: any;
  export const Person: any;
  export const PersonAdd: any;
  export const Group: any;
  export const Email: any;
  export const Phone: any;
  export const LocationOn: any;
  export const DateRange: any;
  export const AccessTime: any;
  export const Notifications: any;
  export const NotificationsOff: any;
  export const Warning: any;
  export const Error: any;
  export const Info: any;
  export const CheckCircle: any;
  export const RadioButtonUnchecked: any;
  export const RadioButtonChecked: any;
  export const CheckBox: any;
  export const CheckBoxOutlineBlank: any;
  export const ExpandMore: any;
  export const ExpandLess: any;
  export const ChevronLeft: any;
  export const ChevronRight: any;
  export const ArrowBack: any;
  export const ArrowForward: any;
  export const Refresh: any;
  export const Sync: any;
  export const CloudUpload: any;
  export const CloudDownload: any;
  export const Folder: any;
  export const FolderOpen: any;
  export const InsertDriveFile: any;
  export const Image: any;
  export const VideoFile: any;
  export const AudioFile: any;
  export const PictureAsPdf: any;
  export const Description: any;
  export const Code: any;
  export const DataObject: any;
  export const Functions: any;
  export const Terminal: any;
  export const BugReport: any;
  export const Build: any;
  export const Extension: any;
  export const Widgets: any;
  export const Dashboard: any;
  export const Analytics: any;
  export const TrendingUp: any;
  export const TrendingDown: any;
  export const BarChart: any;
  export const PieChart: any;
  export const Timeline: any;
  export const Schedule: any;
  export const Event: any;
  export const Today: any;
  export const CalendarToday: any;
  export const WatchLater: any;
  export const History: any;
  export const Update: any;
  export const Autorenew: any;
  export const Cached: any;
  export const Loop: any;
  export const Shuffle: any;
  export const Repeat: any;
  export const RepeatOne: any;
  export const SkipNext: any;
  export const SkipPrevious: any;
  export const FastForward: any;
  export const FastRewind: any;
  export const VolumeUp: any;
  export const VolumeDown: any;
  export const VolumeMute: any;
  export const VolumeOff: any;
  export const Mic: any;
  export const MicOff: any;
  export const Videocam: any;
  export const VideocamOff: any;
  export const ScreenShare: any;
  export const StopScreenShare: any;
  export const CallEnd: any;
  export const Call: any;
  export const Dialpad: any;
  export const Contacts: any;
  export const ContactPhone: any;
  export const ContactMail: any;
  export const Message: any;
  export const Sms: any;
  export const MailOutline: any;
  export const Drafts: any;
  export const Inbox: any;
  export const Outbox: any;
  export const Archive: any;
  export const Unarchive: any;
  export const Label: any;
  export const LabelImportant: any;
  export const Flag: any;
  export const Bookmark: any;
  export const BookmarkBorder: any;
  export const BookmarkAdded: any;
  export const BookmarkRemove: any;
  export const Grade: any;
  export const GradeOutlined: any;
  export const StarHalf: any;
  export const StarOutline: any;
  export const StarRate: any;
  export const ThumbsUpDown: any;
  export const SentimentVeryDissatisfied: any;
  export const SentimentDissatisfied: any;
  export const SentimentNeutral: any;
  export const SentimentSatisfied: any;
  export const SentimentVerySatisfied: any;
  export const Mood: any;
  export const MoodBad: any;
  export const Public: any;
  export const Language: any;
  export const Translate: any;
  export const GTranslate: any;
  export const Spellcheck: any;
  export const FontDownload: any;
  export const FormatBold: any;
  export const FormatItalic: any;
  export const FormatUnderlined: any;
  export const FormatStrikethrough: any;
  export const FormatSize: any;
  export const FormatColorText: any;
  export const FormatColorFill: any;
  export const FormatAlignLeft: any;
  export const FormatAlignCenter: any;
  export const FormatAlignRight: any;
  export const FormatAlignJustify: any;
  export const FormatListBulleted: any;
  export const FormatListNumbered: any;
  export const FormatIndentDecrease: any;
  export const FormatIndentIncrease: any;
  export const FormatQuote: any;
  export const FormatClear: any;
  export const Title: any;
  export const Subject: any;
  export const Notes: any;
  export const Create: any;
  export const CreateNewFolder: any;
  export const NoteAdd: any;
  export const PostAdd: any;
  export const LibraryAdd: any;
  export const PlaylistAdd: any;
  export const QueueMusic: any;
  export const Queue: any;
  export const QueuePlayNext: any;
  export const AddToQueue: any;
  export const RemoveFromQueue: any;
  export const ClearAll: any;
  export const SelectAll: any;
  export const InvertSelection: any;
  export const FilterList: any;
  export const Sort: any;
  export const SortByAlpha: any;
  export const ViewList: any;
  export const ViewModule: any;
  export const ViewQuilt: any;
  export const ViewStream: any;
  export const ViewArray: any;
  export const ViewColumn: any;
  export const ViewComfy: any;
  export const ViewCompact: any;
  export const ViewCarousel: any;
  export const ViewDay: any;
  export const ViewWeek: any;
  export const ViewAgenda: any;
  export const ViewHeadline: any;
  export const Fullscreen: any;
  export const FullscreenExit: any;
  export const PictureInPicture: any;
  export const PictureInPictureAlt: any;
  export const ZoomIn: any;
  export const ZoomOut: any;
  export const ZoomOutMap: any;
  export const CenterFocusStrong: any;
  export const CenterFocusWeak: any;
  export const FitScreen: any;
  export const Crop: any;
  export const CropFree: any;
  export const AspectRatio: any;
  export const Straighten: any;
  export const Rotate90DegreesCcw: any;
  export const Rotate90DegreesCw: any;
  export const RotateLeft: any;
  export const RotateRight: any;
  export const FlipToBack: any;
  export const FlipToFront: any;
  export const Flip: any;
  export const Transform: any;
  export const Tune: any;
  export const FilterVintage: any;
  export const Filter: any;
  export const FilterBAndW: any;
  export const FilterDrama: any;
  export const FilterHdr: any;
  export const FilterNone: any;
  export const FilterTiltShift: any;
  export const Gradient: any;
  export const Grain: any;
  export const Texture: any;
  export const Palette: any;
  export const ColorLens: any;
  export const Brush: any;
  export const Gesture: any;
  export const TouchApp: any;
  export const PanTool: any;
  export const BackHand: any;
  export const FrontHand: any;
  export const Waving: any;
  export const ThumbUpAlt: any;
  export const ThumbDownAlt: any;
  export const Chip: any;
}

declare module '@tanstack/react-query' {
  export const useQuery: any;
  export const useMutation: any;
  export const QueryClient: any;
  export const QueryClientProvider: any;
  export const useQueryClient: any;
}

declare module 'react-hot-toast' {
  export const Toaster: any;
  export const toast: any;
}

declare module 'date-fns' {
  export const format: any;
  export const formatDistanceToNow: any;
  export const isToday: any;
  export const isYesterday: any;
  export const startOfDay: any;
  export const endOfDay: any;
  export const addDays: any;
  export const subDays: any;
  export const parseISO: any;
}

declare module 'react-i18next' {
  export const useTranslation: any;
  export const Trans: any;
  export const Translation: any;
  export const I18nextProvider: any;
  export const initReactI18next: any;
}

declare module 'i18next' {
  const i18n: any;
  export default i18n;
  export const use: any;
  export const init: any;
  export const t: any;
  export const changeLanguage: any;
}

// Global type fixes
declare global {
  namespace JSX {
    interface Element extends React.ReactElement<any, any> { }
    interface ElementClass extends React.Component<any> { }
    interface ElementAttributesProperty { props: {}; }
    interface ElementChildrenAttribute { children: {}; }
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

export {}; 