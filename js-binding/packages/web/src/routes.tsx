import { HashRouter, Route, Switch } from 'react-router-dom';
import { Providers } from './providers';
import {
  AnalyticsView,
  ArtCreateView,
  ArtistsView,
  ArtistView,
  ArtView,
  ArtworksView,
  AuctionCreateView,
  AuctionView,
  JoinRaffleView,
} from './views';
import { AdminView } from './views/admin';
import { BillingView } from './views/auction/billing';
import { StoreListView } from './views/storeList';
import { MintNFTStoreView } from './views/mintNFTStore';
import { CreateLotteryNFTView } from './views/lotteryNFT';
import { GetTicketView } from './views/getTicket';
import { ClaimView } from './views/claim';

export function Routes() {
  return (
    <>
      <HashRouter basename={'/'}>
        <Providers>
          <Switch> 
            <Route exact path="/admin" component={() => <AdminView />} />
            <Route exact path="/join-raffle" component={() => <JoinRaffleView />} />
            <Route exact path="/store-detail/:id/" component={() => <MintNFTStoreView />} />
            <Route exact path="/store-list" component={() => <StoreListView />} />
            <Route exact path="/lottery" component={() => <CreateLotteryNFTView />} />
            <Route exact path="/get-ticket" component={() => <GetTicketView />} />
            <Route exact path="/lottery-details/:id/" component={() => <ClaimView />} />
            <Route
              exact
              path="/analytics"
              component={() => <AnalyticsView />}
            />
            <Route
              exact
              path="/art/create/:step_param?"
              component={() => <ArtCreateView />}
            />
            <Route
              exact
              path="/artworks/:id?"
              component={() => <ArtworksView />}
            />
            <Route exact path="/art/:id" component={() => <ArtView />} />
            <Route exact path="/artists/:id" component={() => <ArtistView />} />
            <Route exact path="/artists" component={() => <ArtistsView />} />
            <Route
              exact
              path="/auction/create/:step_param?"
              component={() => <AuctionCreateView />}
            />
            <Route
              exact
              path="/auction/:id"
              component={() => <AuctionView />}
            />
            <Route
              exact
              path="/auction/:id/billing"
              component={() => <BillingView />}
            />
            <Route path="/" component={() => <div />} />
          </Switch>
        </Providers>
      </HashRouter>
    </>
  );
}
