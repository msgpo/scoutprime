'use strict';
polarity.export = PolarityComponent.extend({
    details: Ember.computed.alias('block.data.details'),
    redThreat: '#fa5843',
    greenThreat: '#7dd21b',
    yellowThreat: '#ffc15d',
    /**
     * Radius of the ticScore circle
     */
    threatRadius: 15,
    /**
     * StrokeWidth of the ticScore circle
     */
    threatStrokeWidth: 2,
    elementRadius: 20,
    elementStrokeWidth: 4,
    elementColor: Ember.computed('details.ticScore', function(){
        return this._getThreatColor(this.get('details.ticScore'));
    }),
    elementStrokeOffset: Ember.computed('details.ticScore', 'elementCircumference', function(){
        return this._getStrokeOffset(this.get('details.ticScore'), this.get('elementCircumference'));
    }),
    threats: Ember.computed('details.threats', function () {
        let self = this;
        let threats = Ember.A();

        this.get('details.threats').forEach(function (threat) {
            let enrichedThreat = {};
            let ticScore = threat['influence-score'];

            enrichedThreat.color = self._getThreatColor(ticScore);
            enrichedThreat.strokeOffset = self._getStrokeOffset(ticScore, self.get('threatCircumference'));
            enrichedThreat.ticScore = ticScore;
            enrichedThreat.name = threat['name'];

            // We treat these two keys in a special way to ensure they always appear as the last
            // two attributes for a threat.
            let firstSeen = threat['first-seen'];
            let lastSeen = threat['observed-at'];

            delete threat['name'];
            delete threat['first-seen'];
            delete threat['observed-at'];
            delete threat['influence-score'];
            delete threat['file'];
            delete threat['type'];

            enrichedThreat.attributes = [];
            let rowArray = [];
            let keys = Object.keys(threat);

            if(firstSeen){
                keys.push('first-seen');
            }

            if(lastSeen){
                keys.push('last-seen');
            }

            threat['first-seen'] = firstSeen;
            threat['last-seen'] = lastSeen;

            for (let i = 0; i < keys.length; i++) {
                let key = keys[i];

                rowArray.push({
                    type: self._getType(threat[key], key),
                    title: self._convertToHumanReadable(key),
                    value: threat[key]
                });

                if (rowArray.length === 2) {
                    enrichedThreat.attributes.push(rowArray);
                    rowArray = [];
                }
            }

            if (rowArray.length > 0) {
                enrichedThreat.attributes.push(rowArray);
            }

            threats.push(enrichedThreat);
        });

        return threats;
    }),
    threatCircumference: Ember.computed('threatRadius', function () {
        return 2 * Math.PI * this.get('threatRadius');
    }),
    elementCircumference: Ember.computed('elementCircumference', function(){
        return 2 * Math.PI * this.get('elementRadius');
    }),
    _getStrokeOffset(ticScore, circumference){
        let progress = ticScore / 100;
        return circumference * (1 - progress);
    },
    _getThreatColor(ticScore){
        if (ticScore >= 75) {
            return this.get('redThreat');
        } else if (ticScore >= 50) {
            return this.get('yellowThreat');
        } else {
            return this.get('greenThreat');
        }
    },
    _convertToHumanReadable(string){
        let newString = '';
        // handle known edge cases
        if(string === 'hashs'){
            return 'Hashes';
        }

        string = string.replace(/hashs/ig, 'hashes');
        string = string.replace(/md5s/ig, 'MD5');
        string = string.replace(/sha(\d+)s/ig, 'SHA-$1');


        for (let i = 0; i < string.length; i++) {
            if (i === 0) {
                newString += string[i].toUpperCase();
            } else if (string[i] === '-') {
                newString += ' ';
            } else {
                newString += string[i]
            }
        }
        return newString;
    },
    _getType(value, attribute){
        // handle date attributes in a special manner
        if(attribute === 'last-seen' || attribute === 'first-seen'){
            return 'date';
        }

        if (Array.isArray(value)) {
            return 'array';
        } else {
            return 'string';
        }
    }
});