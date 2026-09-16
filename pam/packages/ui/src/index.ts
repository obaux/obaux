/**
 * @pam/ui — the PAM-specific components from SOP §2.4.
 *
 * Everything here is composed from Astryx primitives. Nothing here reimplements
 * a component Astryx already ships, and no other UI library is used (§2).
 *
 * The recurring theme: Astryx is built for dense, capable interfaces, and PAM
 * needs the opposite. These wrappers are where that difference lives — bigger
 * targets, one action per screen, real links instead of handlers wherever a
 * flaky connection would otherwise dead-end someone.
 */

export { BigButton, type BigButtonProps } from './BigButton.js';
export {
  PlaceCard,
  type PlaceCardProps,
  directionsHref,
  googlePlaceHref,
} from './PlaceCard.js';
export { PlaceDetail, type PlaceDetailProps } from './PlaceDetail.js';
export { PersonCard, type PersonCardProps } from './PersonCard.js';
export { StepHeader, type StepHeaderProps } from './StepHeader.js';
export { PointsBadge, type PointsBadgeProps } from './PointsBadge.js';
export { HelpBar, type HelpBarProps } from './HelpBar.js';
export { Loading, type LoadingProps } from './Loading.js';
/*
 * `Skeletons` is deliberately NOT re-exported here, the same call `hours.ts`
 * and `dummy-data`'s split made on 16 September: Places, the place screen,
 * the caseload, the directory and a person's profile are the only five
 * screens that use it, none of them is Home, and Home measurably picked up
 * its weight anyway the one time it sat in this barrel. Import it as
 * `@pam/ui/Skeletons`.
 */
export { Notice, type NoticeProps } from './Notice.js';
export { AppHeader, type AppHeaderProps } from './AppHeader.js';
export { AreaChip, type AreaChipProps } from './AreaChip.js';
export { Page, type PageProps } from './Page.js';
export { PageTitle, type PageTitleProps } from './PageTitle.js';
export { RoleSwitch, type RoleSwitchProps } from './RoleSwitch.js';
export {
  OnboardingSlides,
  type OnboardingSlidesProps,
  type OnboardingSlide,
} from './OnboardingSlides.js';
export { NavTile, type NavTileProps } from './NavTile.js';
export { TextLink, type TextLinkProps } from './TextLink.js';
export { NotificationBell, type NotificationBellProps } from './NotificationBell.js';
export {
  NotificationList,
  type NotificationListProps,
  type NotificationItem,
} from './NotificationList.js';
export { VoiceInput, type VoiceInputProps, type SpeechRecognizer } from './VoiceInput.js';
export { TextField, type TextFieldProps } from './TextField.js';
export {
  BellIcon,
  BookmarkIcon,
  EditIcon,
  FlagIcon,
  ShareIcon,
  StarIcon,
  HomeIcon,
  MeIcon,
  MeIconFilled,
  PeopleIcon,
  PhoneIcon,
  PlacesIcon,
  PlanIcon,
} from './icons.js';
export { SavedStrip, type SavedStripProps, type SavedStripPlace } from './SavedStrip.js';
export {
  MotionProvider,
  PageEnter,
  CardEnter,
  ScrollReveal,
  Press,
  MaskedList,
  MaskedItem,
  PAM_MOTION,
} from './motion.js';
export { pam } from './tokens.stylex.js';
