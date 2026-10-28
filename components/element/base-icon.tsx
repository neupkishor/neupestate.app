import Add from '@base/icons/add.svg';
import Area from '@base/icons/land-layer.svg';
import ArrowLeft from '@base/icons/arrow-left.svg';
import Bed from '@base/icons/bed.svg';
import BellAlert from '@base/icons/bell-alert.svg';
import Bell from '@base/icons/bell.svg';
import Call from '@base/icons/call.svg';
import CloudDownload from '@base/icons/cloud-download.svg';
import Comments from '@base/icons/comments.svg';
import Dislike from '@base/icons/dislike.svg';
import DollarCircle from '@base/icons/dollar-circle.svg';
import Download from '@base/icons/download.svg';
import Enter from '@base/icons/enter.svg';
import Exit from '@base/icons/exit.svg';
import Gps from '@base/icons/gps.svg';
import Home from '@base/icons/home.svg';
import Invalid from '@base/icons/invalid.svg';
import Like from '@base/icons/like.svg';
import Location from '@base/icons/location.svg';
import Love from '@base/icons/love.svg';
import Referrer from '@base/icons/referrer.svg';
import Refund from '@base/icons/refund.svg';
import SackDollar from '@base/icons/sack-dollar.svg';
import Save from '@base/icons/save.svg';
import Search from '@base/icons/search.svg';
import Secured from '@base/icons/secured.svg';
import Shower from '@base/icons/shower.svg';
import Parking from '@base/icons/parking-sign.svg';
import Share from '@base/icons/share.svg';
import Settings from '@base/icons/settings.svg';
import Unsave from '@base/icons/unsave.svg';
import User from '@base/icons/user.svg';
import Whatsapp from '@base/icons/whatsapp.svg';
import WriteEmail from '@base/icons/write-email.svg';
import type { ComponentType } from 'react';
import type { SvgProps } from 'react-native-svg';

const icons = {
  add: Add,
  area: Area,
  'arrow-left': ArrowLeft,
  bed: Bed,
  'bell-alert': BellAlert,
  bell: Bell,
  call: Call,
  'cloud-download': CloudDownload,
  comments: Comments,
  dislike: Dislike,
  'dollar-circle': DollarCircle,
  download: Download,
  enter: Enter,
  exit: Exit,
  gps: Gps,
  home: Home,
  invalid: Invalid,
  like: Like,
  location: Location,
  love: Love,
  referrer: Referrer,
  refund: Refund,
  'sack-dollar': SackDollar,
  save: Save,
  search: Search,
  secured: Secured,
  shower: Shower,
  parking: Parking,
  share: Share,
  settings: Settings,
  unsave: Unsave,
  user: User,
  whatsapp: Whatsapp,
  'write-email': WriteEmail,
} satisfies Record<string, ComponentType<SvgProps>>;

export type BaseIconName = keyof typeof icons;

export function BaseIcon({
  name,
  size = 20,
  color = '#173d35',
  rotation = 0,
  style,
  ...props
}: SvgProps & { name: BaseIconName; size?: number; color?: string; rotation?: number }) {
  const Icon = icons[name];
  return <Icon {...props} width={size} height={size} fill={color} color={color} style={[style, rotation ? { transform: [{ rotate: `${rotation}deg` }] } : undefined]} />;
}
