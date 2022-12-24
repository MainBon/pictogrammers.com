import {
  ChangeEvent,
  Fragment,
  FunctionComponent,
  MouseEvent,
  useEffect,
  useRef,
  useState
} from 'react';
import getConfig from 'next/config';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import cx from 'clsx';
import { VirtuosoGrid } from 'react-virtuoso';
import dayjs from 'dayjs';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Tooltip from '@mui/material/Tooltip';
import Chip, { ChipProps } from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Icon from '@mdi/react';
import { mdiAlertCircleOutline, mdiClose, mdiCloseCircle, mdiCreation, mdiMagnify, mdiShape } from '@mdi/js';

import { IconLibraryIcon } from '../../interfaces/icons';

import useCategories from '../../hooks/useCategories';
import useIcons from '../../hooks/useIcons';
import useDebounce from '../../hooks/useDebounce';
import useWindowSize from '../../hooks/useWindowSize';

import LibraryMenu from './LibraryMenu';
import LibraryViewMode, { viewModes } from './LibraryViewMode';
import IconView from './IconView';

import iconLibraries from '../../public/libraries/libraries.json';
import allContributors from '../../public/contributors/contributors.json';

import classes from './IconLibraryView.module.scss';

interface IconLibraryViewProps {
  author?: string;
  category?: string;
  library: string;
  slug: string;
  version?: string;
}

const IconLibraryView: FunctionComponent<IconLibraryViewProps> = ({ author, category, library, slug, version }) => { 
  // Filter handling
  const searchBoxRef = useRef<HTMLInputElement>(null);
  const iconLibraryHeadingRef = useRef<HTMLDivElement>(null);
  const iconLibraryRef = useRef<HTMLDivElement>(null);
  const [ searchTerm, setSearchTerm ] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm.trim(), 250);

  // Library config and metadata
  const { publicRuntimeConfig: { libraries } } = getConfig();
  const libraryConfig = libraries.icons.find((c: any) => c.id === library);
  const {
    date: libraryReleaseDate,
    version: libraryVersion
  } = iconLibraries[library as keyof typeof iconLibraries];

  // Library viewing
  const [ viewMode, setViewMode ] = useState('comfortable');
  const categories = useCategories(library);
  const visibleIcons = useIcons(library, { author, category, term: debouncedSearchTerm, version });

  // Individual icon viewing
  const router = useRouter();
  const [ iconModal, setIconModal ] = useState<IconLibraryIcon | null>(null);
  
  // Responsive concerns
  const windowSize = useWindowSize();
  const isMobileWidth = windowSize.width <= parseInt(classes['mobile-width']);

  useEffect(() => {
    if (debouncedSearchTerm) {
      scrollToTopOfLibrary();
    }
  }, [ debouncedSearchTerm, visibleIcons.length ]);

  useEffect(() => {
    const handleRouteChange = (url: string) => {
      if (url === `/library/${library}`) {
        setIconModal(null);
      }
    };

    router.events.on('routeChangeStart', handleRouteChange);
    return () => router.events.off('routeChangeStart', handleRouteChange);
  }, [ library, router ]);

  const scrollToTopOfLibrary = () => {
    const libraryTop = iconLibraryRef.current?.getBoundingClientRect().top;
    const headingHeight = iconLibraryHeadingRef.current?.clientHeight;

    if (!libraryTop || !headingHeight) {
      return;
    }

    const top = libraryTop + window.pageYOffset - headingHeight;
    window.scrollTo({ top });
  };

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchClear = () => {
    setSearchTerm('');
    searchBoxRef.current?.focus();
    scrollToTopOfLibrary();
  };

  const handleIconModalOpen = (e: MouseEvent<HTMLAnchorElement>, icon: IconLibraryIcon) => {
    e.preventDefault();
    setIconModal(icon);
    router.push(`/library/${library}/icon/${icon.n}`, undefined, { shallow: true });
  };

  const handleIconModalClose = () => {
    setIconModal(null);
    router.push(`/library/${slug}`, undefined, { shallow: true });
  };

  const handleChipDelete = () => {
    router.push(`/library/${library}`);
  };

  const renderCategories = () => {
    if (!categories?.length) {
      return null;
    }

    return (
      <Fragment>
        <ListSubheader sx={{ background: 'transparent', marginTop: '1rem', textTransform: 'uppercase' }}>Categories</ListSubheader>
        {categories?.length && Object.keys(categories).map((catId) => {
          const categorySlug = categories[catId as any].slug;
          return (
            <ListItemButton
              component={Link}
              href={`/library/${library}/category/${categorySlug}`}
              key={catId}
              selected={categorySlug === category}
            >
              <ListItemText>
                {categories[catId as any].name}
              </ListItemText>
            </ListItemButton>
          );
        })}
      </Fragment>
    );
  };

  const renderFilteredByChip = (size: ChipProps['size'] = undefined) => {
    if (version) {
      return <Chip icon={<Icon path={mdiCreation} size={.7} />} label={`New in v${version}`} onDelete={handleChipDelete} size={size} />;
    }

    if (category) {
      const categoryName = categories.find((cat) => cat.slug === category)?.name || category;
      return <Chip icon={<Icon path={mdiShape} size={.7} />} label={categoryName} onDelete={handleChipDelete} size={size} />;
    }
    
    if (author) {
      const { contributors } = allContributors;
      const authorInfo = contributors.find((contributor) => contributor.github === author);
      if (authorInfo) {
        return <Chip avatar={<Avatar alt={authorInfo.name} src={`/contributors/${authorInfo.id}.jpg`} />} label={`By ${authorInfo.name}`} onDelete={handleChipDelete} size={size} />;
      }

      return <Chip label={`By ${author}`} onDelete={handleChipDelete} size={size} />;
    }
  };

  const renderInformationBox = () => {
    if (version && !debouncedSearchTerm) {
      return (
        <Alert severity='info' sx={{ marginBottom: '1rem' }}>
          <AlertTitle>New Icons in v{version}</AlertTitle>
          Please be sure to check the <Link href={`/docs/${library}/changelog`}>changelog</Link> before updating as icon updates, removals, and renames are not reflected here.
        </Alert>
      );
    }
  };

  return (
    <div className={classes.root}>
      <Head>
        <title>{`${libraryConfig.name} - Icon Library - Pictogrammers`}</title>
        <meta content={`${libraryConfig.name} - Icon Library - Pictogrammers`} name='title' key='title' />
        {libraryConfig.description && <meta content={libraryConfig.description} name='description' key='description' />}

        <meta content={`${libraryConfig.name} - Icon Library - Pictogrammers`} property='og:title' key='og:title' />
        {libraryConfig.description && <meta content={libraryConfig.description} property='og:description' key='og:description' />}
        <meta content={`https://pictogrammers.com/${slug}`} property='og:url' key='og:url' />

        <meta content={`${libraryConfig.name} - Icon Library - Pictogrammers`} name='twitter:title' key='twitter:title' />
        {libraryConfig.description && <meta content={libraryConfig.description} name='twitter:description' key='twitter:description' />}
      </Head>
      <Paper className={classes.container}>
        <div className={classes.libraryView}>
          <div className={classes.heading} ref={iconLibraryHeadingRef}>
            <div className={classes.libraryInfo}>
              <LibraryMenu compact={isMobileWidth} selectedLibrary={libraryConfig} />
              <Tooltip title={`Released on ${dayjs(libraryReleaseDate).format('YYYY/MM/DD')}`} placement='left'>
                <Chip color='secondary' label={`v${libraryVersion}`} />
              </Tooltip>
            </div>
            <div className={classes.controls}>
              <TextField
                classes={{ root: classes.searchBox }}
                fullWidth
                InputProps={{
                  endAdornment: (
                    <InputAdornment
                      onClick={handleSearchClear}
                      position='end'
                      sx={{
                        cursor: searchTerm !== '' ? 'pointer' : 'default'
                      }}
                    >
                      {searchTerm !== '' && <Icon path={mdiCloseCircle} size={1} />}
                      {searchTerm === '' && <Icon path='' size={1} />}
                    </InputAdornment>
                  ),
                  inputRef: searchBoxRef,
                  startAdornment: (
                    <InputAdornment position='start'>
                      <Icon path={mdiMagnify} size={1} />
                      {!isMobileWidth && renderFilteredByChip('small')}
                    </InputAdornment>
                  )
                }}
                onChange={handleSearchChange}
                placeholder={`Seach ${!isMobileWidth && visibleIcons.length > 0 ? `${visibleIcons.length} ` : ''}Icons...`}
                size='small'
                sx={{
                  margin: '0 1rem 0 0'
                }}
                value={searchTerm}
                variant='outlined'
              />
              <LibraryViewMode
                currentView={viewMode}
                compact={isMobileWidth}
                setViewMode={setViewMode}
              />
            </div>
            {isMobileWidth && (author || category || version) && (
              <div className={classes.mobileControls}>
                <strong>Filter:</strong> {renderFilteredByChip()}
              </div>
            )}
          </div>
          <div className={classes.iconLibrary} ref={iconLibraryRef}>
            <aside className={classes.sidebar}>
              <List dense>
                <ListItemButton
                  component={Link}
                  href={`/library/${library}/version/${libraryVersion}`}
                  selected={version === libraryVersion}
                >
                  <Icon path={mdiCreation} size={.8} />
                  <ListItemText sx={{ marginLeft: '.2rem' }}>New in v{libraryVersion}</ListItemText>
                </ListItemButton>
                {renderCategories()}
                <ListSubheader sx={{ background: 'transparent', marginTop: '1rem', textTransform: 'uppercase' }}>Releases</ListSubheader>
                <ListItemButton component={Link} href={`/docs/${library}/changelog`}>
                  <ListItemText>Changelog</ListItemText>
                </ListItemButton>
                <ListItemButton component={Link} href={`/docs/${library}/upgrade`}>
                  <ListItemText>Upgrade Guide</ListItemText>
                </ListItemButton>
                <ListItemButton component={Link} href={`/history/${library}`}>
                  <ListItemText>History</ListItemText>
                </ListItemButton>
                
              </List>
            </aside>
            <div className={classes.libraryContainer}>
              {!visibleIcons.length && debouncedSearchTerm ? (
                <div className={classes.noResults}>
                  <Icon path={mdiAlertCircleOutline} size={3} />
                  <p>No icons were found based on your search criteria.</p>
                </div>
              ) : !visibleIcons.length ? (
                <div className={classes.loader}>
                  <CircularProgress />
                  Gathering up the icons...
                </div>
              ) : (
                <Fragment>
                  {renderInformationBox()}
                  <VirtuosoGrid
                    data={visibleIcons}
                    itemClassName={classes.libraryItem}
                    listClassName={cx(classes.library, classes[viewMode])}
                    itemContent={(index, icon: IconLibraryIcon) => (
                      <Link
                        className={classes.libraryIcon}
                        href={`/library/${library}/icon/${icon.n}`}
                        onClick={(e) => handleIconModalOpen(e, icon)}
                      >
                        <Icon path={icon.p} size={viewModes[viewMode as keyof typeof viewModes].iconSize} />
                        <p>{icon.n}</p>
                      </Link>
                    )}
                    totalCount={visibleIcons.length}
                    useWindowScroll
                  />
                </Fragment>
              )}
              {!!iconModal && (
                <Dialog
                  fullScreen={isMobileWidth}
                  open
                  onClose={handleIconModalClose}
                >
                  <DialogTitle sx={{ position: 'sticky', textAlign: 'right', top: 0 }}>
                    <IconButton
                      aria-label='Close'
                      onClick={handleIconModalClose}
                    >
                      <Icon path={mdiClose} size={1} />
                    </IconButton>
                  </DialogTitle>
                  <IconView icon={iconModal} library={libraryConfig.id} />
                </Dialog>
              )}
            </div>
          </div>
        </div>
      </Paper>
    </div>
  );
};

export default IconLibraryView;