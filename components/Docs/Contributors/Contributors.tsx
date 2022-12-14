import cx from 'clsx';
import Card from '@mui/material/Card';
import Avatar from '@mui/material/Avatar';
import Badge from '@mui/material/Badge';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Icon from '@mdi/react';
import { siGithub, siTwitter } from 'simple-icons';
import { mdiHeart, mdiLinkVariant } from '@mdi/js';

import { ContributorProps, ContributorsMdxProps } from '../../../interfaces/contributor';

import classes from './Contributors.module.scss';

const Contributor = ({
  core,
  github,
  iconCount,
  id,
  name,
  noImage,
  sponsored,
  twitter,
  website
}: ContributorProps) => {
  return (
    <Card
      classes={{ 
        root: cx(classes.contributor,{
          [classes.core]: core
        })
      }}
    >
      <Badge
        anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
        badgeContent={core && 'Core'}
        classes={{ badge: classes.badge, root: classes.box }}
        invisible={!core}
      >
        <div className={classes.content}>
          <Avatar
            alt={name}
            classes={{ root: classes.avatar }}
            src={!noImage ? `/contributors/${id}.jpg` : undefined}
          >
            {name.split(' ').map((n)=>n[0]).join('').toUpperCase()}
          </Avatar>
          <div className={classes.info}>
            <h2 title={name}>{name}</h2>
            <p>{new Intl.NumberFormat('en-US').format(iconCount)} Icon{iconCount === 0 || iconCount > 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className={classes.links}>
          {sponsored && github && (
            <Tooltip title={`Sponsor ${name} on GitHub`}>
              <IconButton
                aria-label={`Sponsor ${name} on GitHub`}
                classes={{ root: classes.sponsor }}
                href={`https://github.com/sponsors/${github}`}
                target='_blank'
              >
                <Icon path={mdiHeart} size={1} />
              </IconButton>
            </Tooltip>
          )}
          {github && (
            <Tooltip title={`View ${github} on GitHub`}>
              <IconButton
                aria-label={`View ${github} on GitHub`}
                href={`https://github.com/${github}`}
                target='_blank'
              >
                <Icon path={siGithub.path} size={.9} />
              </IconButton>
            </Tooltip>
          )}
          {twitter && (
            <Tooltip title={`View ${twitter} on Twitter`}>
              <IconButton
                aria-label={`View ${twitter} on Twitter`}
                href={`https://twitter.com/${twitter}`}
                target='_blank'
              >
                <Icon path={siTwitter.path} size={.9} />
              </IconButton>
            </Tooltip>
          )}
          {website && (
            <Tooltip title={`Visit ${name}'s Website`}>
              <IconButton
                aria-label={`Visit ${name}'s Website`}
                href={website}
                target='_blank'
              >
                <Icon path={mdiLinkVariant} size={1} />
              </IconButton>
            </Tooltip>
          )}
        </div>
      </Badge>
    </Card>
  );
};

const Contributors = ({ contributors: { contributors }, id, view }: ContributorsMdxProps) => {
  const filteredList = contributors.filter((contributor) => {
    if (view === 'single' && id) {
      return contributor.id === id;
    }

    if (view === 'core') {
      return contributor.core;
    }

    if (view === 'community') {
      return !contributor.core;
    }

    return contributor;
  });

  return (
    <div className={classes.contributors}>
      {filteredList.map((contributorInfo) => (
        <Contributor key={contributorInfo.id} {...contributorInfo} />
      ))}
    </div>
  );
};

export default Contributors;