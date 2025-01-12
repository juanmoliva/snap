
import React, { useState, useMemo, useEffect } from "react"
import { useLocation } from '@reach/router'
import { Personal } from 'web3x/personal'
import { Address } from 'web3x/address'
import useAsyncTask from 'decentraland-gatsby/dist/hooks/useAsyncTask'
import useAsyncMemo from 'decentraland-gatsby/dist/hooks/useAsyncMemo'
import usePatchState from 'decentraland-gatsby/dist/hooks/usePatchState'
import Grid from "semantic-ui-react/dist/commonjs/collections/Grid/Grid"
import { Header } from "decentraland-ui/dist/components/Header/Header"
import { Loader } from "decentraland-ui/dist/components/Loader/Loader"
import { Button } from "decentraland-ui/dist/components/Button/Button"
import Paragraph from "decentraland-gatsby/dist/components/Text/Paragraph"
import { navigate } from "gatsby-plugin-intl"
import { Governance } from "../api/Governance"
import useQuest from "../hooks/useQuest"
import { Link } from "gatsby"

 import ContentLayout, { ContentSection } from "../components/Layout/ContentLayout"
 import CategoryLabel from "../components/Quest/QuestCategoryLabel"
 import StatusLabel from "../components/Quest/QuestStatusLabel"
 import ForumButton from "../components/Section/ForumButton"
 import SubscribeButton from "../components/Section/SubscribeButton"
 import ProposalResultSection from "../components/Section/ProposalResultSection"
 import ProposalDetailSection from "../components/Section/ProposalDetailSection"
import useAuthContext from "decentraland-gatsby/dist/context/Auth/useAuthContext"
 import { forumUrl } from "../entities/Proposal/utils"
 import { Snapshot } from "../api/Snapshot"
import Land from 'decentraland-gatsby/dist/utils/api/Land'
import Markdown from "decentraland-gatsby/dist/components/Text/Markdown"
 import { VoteRegisteredModal } from "../components/Modal/VoteRegisteredModal"
 import { DeleteProposalModal } from "../components/Modal/DeleteProposalModal"
import useFormatMessage from "decentraland-gatsby/dist/hooks/useFormatMessage"
import retry from "decentraland-gatsby/dist/utils/promise/retry"
import locations from "../modules/locations"
import loader from "../modules/loader"
 import { UpdateProposalStatusModal } from "../components/Modal/UpdateProposalStatusModal"
import { QuestCategory, QuestStatus } from "../entities/Quest/types"
 import ProposalHeaderPoi from "../components/Proposal/ProposalHeaderPoi"
import Head from "decentraland-gatsby/dist/components/Head/Head"
import { formatDescription } from "decentraland-gatsby/dist/components/Head/utils"

import './quests.css'
import './quest.css'
import NotFound from "decentraland-gatsby/dist/components/Layout/NotFound"
 import ProposalFooterPoi from "../components/Proposal/ProposalFooterPoi"
import { EscalatorWarningTwoTone } from "@mui/icons-material"

type ProposalPageOptions = {
  changing: boolean
  confirmDeletion: boolean
}

export default function QuestPage() {
  const l = useFormatMessage()
  const location = useLocation()
  const params = useMemo(() => new URLSearchParams(location.search), [location.search])
  const [options, patchOptions] = usePatchState<ProposalPageOptions>({ changing: false, confirmDeletion: false })
  const [account, { provider }] = useAuthContext()
  const [quest, questState] = useQuest(params.get('id'))
  const [questTitle, setQuestTitle] = useState<string>('')
  const [questDescription, setQuestDescription] = useState<string>('')
  const [eventQuestData, setEventQuestData] = useState<any>()
  const [POITile, setPOITile] = useState<any>()
  const [committee] = useAsyncMemo(() => Governance.get().getCommittee(), [])

  const [deleting, deleteQuest] = useAsyncTask(async () => {
    if (quest && account && committee && committee.includes(account)) {
      // await Governance.get().deleteQuest(quest.id)
      navigate(locations.quests())
    }
  })

  useEffect(() => {
    async function fetchEvent(event_id: string) {
      let event = await fetch('https://events.decentraland.org/api/events/' + event_id).then(res => res.json())
      if( event.ok ) {
        setEventQuestData(event.data)
        setQuestTitle(event.data.name)
        setQuestDescription(event.data.description)
      }
    }

    async function fetchPOITile(x: number, y:number) {
      let tile = await Land.get().getTile([x, y])
      if( tile ){
        setPOITile(tile)
        setQuestTitle(tile.name || '')
        setQuestDescription("Submit the best Snap for this Point of Interest!")
      }
    }

    if( quest ) {
      if( quest.category == QuestCategory.Event ) {
        fetchEvent(quest.configuration.event_id)
      } else if ( quest.category == QuestCategory.PointOfInterest ) {
        fetchPOITile(Number(quest.configuration.poi_location_x), Number(quest.configuration.poi_location_y))
      } else {
        setQuestTitle(quest.configuration.title)
        setQuestDescription(quest.configuration.description)
      }
    }
    
  }, [quest])

  const isCommittee = useMemo(() => !!(quest && account && committee && committee.includes(account)), [ quest, account, committee ])

  if (questState.error) {
    return <>
      <ContentLayout className="QuestDetailPage">
        <NotFound />
      </ContentLayout>
    </>
  }

  return <>
    <Head
      title={ questTitle || l('page.proposal_detail.title') || ''}
      description={(questDescription && formatDescription(questDescription)) || l('page.proposal_detail.description') || ''}
      image="https://decentraland.org/images/decentraland.png"
    />
    <ContentLayout className="QuestDetailPage">
      <ContentSection>
        <Header size="huge">{questTitle || ''} &nbsp;</Header>
        <Loader active={!quest} />
        <div style={{ minHeight: '24px' }}>
          {quest && <StatusLabel status={quest.status} />}
          {quest && <CategoryLabel type={quest.category} />}
        </div>
      </ContentSection>
      <Grid stackable>
        <Grid.Row>

          <Grid.Column tablet="12" className="QuestDetailDescription">
            <Loader active={questState.loading} />
            {/* <ProposalHeaderPoi proposal={quest} /> */}
            <Markdown source={questDescription|| ''} />
            {/* <ProposalFooterPoi proposal={proposal} /> */}
          </Grid.Column>

          { quest && 
            <Link to={`/submitSnap/?quest_id=${quest.id}`}>
              <Button size="huge" primary>
                Submit Snap
              </Button>
            </Link>
            }

          { quest && 
            <Link to={`/snaps?quest_id=${quest.id}`}>
              <Button size="huge" primary>
                See Snaps
              </Button>
            </Link>
          }

          {/* <Grid.Column tablet="4" className="QuestDetailActions">
            <ForumButton loading={proposalState.loading} disabled={!proposal} href={proposal && forumUrl(proposal) || ''} />
            <SubscribeButton
              loading={proposalState.loading || subscriptionsState.loading || subscribing}
              disabled={!proposal}
              subscribed={subscribed}
              onClick={() => subscribe(!subscribed)}
            />
            <ProposalResultSection
              disabled={!proposal || !votes}
              loading={voting || proposalState.loading || votesState.loading || votingPowerState.loading}
              proposal={proposal}
              votes={votes}
              votingPower={votingPower || 0}
              changingVote={options.changing}
              onChangeVote={(_, changing) => patchOptions({ changing })}
              onVote={(_, choice, choiceIndex) => vote(choice, choiceIndex)}
            />
            <ProposalDetailSection proposal={proposal} />
            {isOwner && <Button
                basic
                loading={deleting}
                style={{ width: '100%' }}
                disabled={proposal?.status !== ProposalStatus.Pending && proposal?.status !== ProposalStatus.Active}
                onClick={() => patchOptions({ confirmDeletion: true })}
              >{l('page.proposal_detail.delete')}</Button>
            }
            {
              isCommittee &&
              proposal?.status === ProposalStatus.Passed &&
              <Button
                basic
                loading={updatingStatus}
                style={{ width: '100%' }}
                onClick={() => patchOptions({ confirmStatusUpdate: ProposalStatus.Enacted })}
              >{l('page.proposal_detail.enact')}</Button>
            }
            {
              isCommittee &&
              proposal?.status === ProposalStatus.Finished &&
              <Button
                basic
                loading={updatingStatus}
                style={{ width: '100%' }}
                onClick={() => patchOptions({ confirmStatusUpdate: ProposalStatus.Passed })}
              >{l('page.proposal_detail.pass')}</Button>
            }
            {
              isCommittee &&
              proposal?.status === ProposalStatus.Finished &&
              <Button
                basic
                loading={updatingStatus}
                style={{ width: '100%' }}
                onClick={() => patchOptions({ confirmStatusUpdate: ProposalStatus.Rejected })}
              >{l('page.proposal_detail.reject')}</Button>
            }
          </Grid.Column> */}
        </Grid.Row>
      </Grid>
    </ContentLayout>{/* 
    <VoteRegisteredModal
      loading={subscribing}
      open={options.confirmSubscription}
      onClickAccept={() => subscribe()}
      onClose={() => patchOptions({ confirmSubscription: false })}
    />
    <DeleteProposalModal
      loading={deleting}
      open={options.confirmDeletion}
      onClickAccept={() => deleteProposal()}
      onClose={() => patchOptions({ confirmDeletion: false })}
    />
    <UpdateProposalStatusModal
      open={!!options.confirmStatusUpdate}
      status={options.confirmStatusUpdate || null}
      loading={updatingStatus}
      onClickAccept={(_, status, description) => updateProposalStatus(status, description)}
      onClose={() => patchOptions({ confirmStatusUpdate: false })}
    />  */}
  </>
}
