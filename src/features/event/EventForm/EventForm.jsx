/*global google*/

import React, { Component } from "react";
import { connect } from "react-redux";
import { withFirestore } from "react-redux-firebase";
import { reduxForm, Field } from "redux-form";
import {
  composeValidators,
  combineValidators,
  isRequired,
  hasLengthGreaterThan
} from "revalidate";
import { geocodeByAddress, getLatLng } from "react-places-autocomplete";
import Script from "react-load-script";
import { Segment, Form, Button, Grid, Header } from "semantic-ui-react";
import { createEvent, updateEvent, cancelToggle } from "../eventActions";
import TextInput from "../../../app/common/form/TextInput";
import TextArea from "../../../app/common/form/TextArea";
import SelectInput from "../../../app/common/form/SelectInput";
import DateInput from "../../../app/common/form/DateInput";
import PlaceInput from "../../../app/common/form/PlaceInput";

const mapState = (state) => {

  let event = {};

  if (state.firestore.ordered.events && state.firestore.ordered.events[0]) {
    event = state.firestore.ordered.events[0];
  }
  return {
    initialValues: event,
    event
  };
};

const actions = {
  createEvent,
  updateEvent,
  cancelToggle
};

const category = [
  { key: "templebar", text: "Temple Bar", value: "templebar" },
  { key: "running", text: "Running", value: "running" },
  { key: "exercise", text: "Exercise", value: "exercise" },
  { key: "singing", text: "Singing", value: "singing" },
  { key: "drink", text: "Drink", value: "drinks" },
  { key: "travel", text: "Travel", value: "travel" }
];
const categoryContribution = [
  { key: "5", text: "5", value: "5" },
  { key: "10", text: "10", value: "10" },
  { key: "15", text: "15", value: "15" },
  { key: "20", text: "20", value: "20" },
  { key: "25", text: "25", value: "25" },
  { key: "30", text: "30", value: "30" }
];

const validate = combineValidators({
  title: isRequired({ message: "The TH title is required" }),
  category: isRequired({ message: "Please provide a category" }),
  description: composeValidators(
    isRequired({ message: "Please enter a description" }),
    hasLengthGreaterThan(4)({
      message: "Description needs to be at least 5 characters."
    })
  )(),
  city: isRequired("city"),
  venue: isRequired("venue"),
  date: isRequired("date")
});

class EventForm extends Component {
  state = {
    cityLatLng: {},
    venueLatLng: {},
    scriptLoaded: false
  };

  async componentDidMount() {
    const {firestore, match} = this.props;
    await firestore.setListener(`events/${match.params.id}`)
  }

  async componentWillUnmount(){
    const {firestore, match} = this.props;
    await firestore.unsetListener(`events/${match.params.id}`)
  }

  handleScriptLoaded = () => this.setState({ scriptLoaded: true });
  //When someone selects a city then we're going to need
  //to get those coordinates
  handleCitySelect = selectedCity => {
    //use geocode and pass in the selectedcity function
    geocodeByAddress(selectedCity)
      //this will return a promess
      .then(results => getLatLng(results[0]))
      .then(latlng => {
        this.setState({
          cityLatLng: latlng
        });
      })
      .then(() => {
        this.props.change("city", selectedCity);
      });
  };

  handleVenueSelect = selectedVenue => {
    //use geocode and pass in the selectedcity function
    geocodeByAddress(selectedVenue)
      //this will return a promess
      .then(results => getLatLng(results[0]))
      .then(latlng => {
        this.setState({
          venueLatLng: latlng
        });
      })
      .then(() => {
        this.props.change("venue", selectedVenue);
      });
  };

  //When we click view on each TH,
  //We're going to be able to see the event with more details
  onFormSubmit = values => {
    values.venueLatLng = this.state.venueLatLng;
    if (this.props.initialValues.id) {
      if(Object.keys(values.venueLatLng).length === 0){
        values.venueLatLng = this.props.event.venueLatLng
      }
      this.props.updateEvent(values);
      this.props.history.goBack();
    } else {
      this.props.createEvent(values);
      this.props.history.push("/events");
    }
  };

  render() {
    const { invalid, submitting, pristine, event, cancelToggle } = this.props;
    return (
      <Grid>
        <Script
          url="https://maps.googleapis.com/maps/api/js?key=AIzaSyA8iT1dX7WDRLyHeTlFwRT8EfJs4ShZDrQ&libraries=places"
          onLoad={this.handleScriptLoaded}
        />
        <Grid.Column width={10}>
          <Segment style={{ margin: "50px 0px" }}>
            <Header sub color="teal" content="Treasure Hunt Details" />
            <Form onSubmit={this.props.handleSubmit(this.onFormSubmit)}>
              <Field
                name="title"
                type="text"
                component={TextInput}
                placeholder="TH Name"
              />
              <Field
                name="category"
                type="text"
                component={SelectInput}
                options={category}
                placeholder="What is your TH About?"
              />
              <Field
                name="description"
                type="text"
                rows={3}
                component={TextArea}
                placeholder="Tell us About your TH"
              />
              <Header sub color="teal" content="Treasure Hunt Location" />
              <Field
                name="city"
                type="text"
                component={PlaceInput}
                options={{ types: ["(cities)"] }}
                placeholder="TH City"
                onSelect={this.handleCitySelect}
              />
              {this.state.scriptLoaded && (
                <Field
                  name="venue"
                  type="text"
                  options={{
                    location: new google.maps.LatLng(this.state.cityLatLng),
                    radius: 10000,
                    types: ["establishment"]
                  }}
                  component={PlaceInput}
                  placeholder="TH Venue"
                  onSelect={this.handleVenueSelect}
                />
              )}
              <Field
                name="date"
                type="text"
                component={DateInput}
                dateFormat="YYYY-MM-DD HH:mm"
                timeFormat="HH:mm"
                showTimeSelect
                placeholder="Date and Time of Treasure H"
              />
              <Header sub color="teal" content="Contribution (Euro)" />
              <Field
                name="contribution"
                type="text"
                component={SelectInput}
                options={categoryContribution}
                placeholder="TH Contribution in €"
              />
              <Button
                //Button is disabled unless we fill up the form
                disabled={invalid || submitting || pristine}
                positive
                style={{ background: "#008577", color: "white" }}
                type="submit"
              >
                Submit
              </Button>
              <Button onClick={this.props.history.goBack} type="button">
                Cancel
              </Button>
              <Button 
                onClick={() => cancelToggle(!event.cancelled, event.id)}
                type='button'
                color={event.cancelled ? 'green' : 'red'}
                floated='right'
                content={event.cancelled ? 'Reactivate Treasure Hunt' : 'Cancel Treasure Hunt'}
              />
            </Form>
          </Segment>
        </Grid.Column>
      </Grid>
    );
  }
}
export default withFirestore(
  connect(
    mapState,
    actions
  )(
    reduxForm({ form: "eventForm", enableReinitialize: true, validate })(
      EventForm
    )
  )
);
